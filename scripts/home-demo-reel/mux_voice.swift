// Adds a voice-over to the overview reel without re-encoding the picture.
// Video samples are copied as-is; audio cues are placed at their start times
// (gaps are silence) and encoded to AAC. Works with one full-length WAV from
// the voice artist (a single cue at 0) or with one file per line.
//
// usage: swift mux_voice.swift <video.mp4> <cues.tsv> <out.mp4>
//   cues.tsv: one "startSeconds<TAB>/path/to/audio" per line (wav/aiff/m4a)
import AVFoundation
import Foundation

let args = CommandLine.arguments
guard args.count == 4 else {
    fputs("usage: mux_voice <video.mp4> <cues.tsv> <out.mp4>\n", stderr)
    exit(2)
}

func run() async throws {
    let video = AVURLAsset(url: URL(fileURLWithPath: args[1]))
    let duration = try await video.load(.duration)
    guard let srcVideo = try await video.loadTracks(withMediaType: .video).first else { fatalError("no video track") }

    // Composition: the reel's picture + every cue at its start time.
    let comp = AVMutableComposition()
    let vTrack = comp.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid)!
    try vTrack.insertTimeRange(CMTimeRange(start: .zero, duration: duration), of: srcVideo, at: .zero)
    let aTrack = comp.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid)!

    let lines = try String(contentsOfFile: args[2], encoding: .utf8).split(separator: "\n")
    for line in lines {
        let parts = line.split(separator: "\t").map(String.init)
        guard parts.count == 2, let start = Double(parts[0]) else { continue }
        let cue = AVURLAsset(url: URL(fileURLWithPath: parts[1]))
        guard let src = try await cue.loadTracks(withMediaType: .audio).first else { fatalError("no audio in \(parts[1])") }
        var cueDur = try await cue.load(.duration)
        let at = CMTime(seconds: start, preferredTimescale: 48000)
        // Never run past the end of the picture.
        let room = CMTimeSubtract(duration, at)
        if CMTimeCompare(cueDur, room) > 0 {
            fputs("warning: cue at \(start)s trimmed by \(String(format: "%.2f", (cueDur - room).seconds))s\n", stderr)
            cueDur = room
        }
        try aTrack.insertTimeRange(CMTimeRange(start: .zero, duration: cueDur), of: src, at: at)
    }
    // Pad the audio track to the full length so the tracks end together.
    let audioEnd = aTrack.timeRange.end
    if CMTimeCompare(audioEnd, duration) < 0 {
        aTrack.insertEmptyTimeRange(CMTimeRange(start: audioEnd, end: duration))
    }

    let outURL = URL(fileURLWithPath: args[3])
    try? FileManager.default.removeItem(at: outURL)
    let reader = try AVAssetReader(asset: comp)
    let vOut = AVAssetReaderTrackOutput(track: vTrack, outputSettings: nil)
    let aOut = AVAssetReaderAudioMixOutput(audioTracks: [aTrack], audioSettings: [
        AVFormatIDKey: kAudioFormatLinearPCM,
        AVSampleRateKey: 48000,
        AVNumberOfChannelsKey: 2,
        AVLinearPCMBitDepthKey: 16,
        AVLinearPCMIsFloatKey: false,
        AVLinearPCMIsBigEndianKey: false,
        AVLinearPCMIsNonInterleaved: false,
    ])
    reader.add(vOut)
    reader.add(aOut)

    let writer = try AVAssetWriter(outputURL: outURL, fileType: .mp4)
    writer.shouldOptimizeForNetworkUse = true
    let hint = try await srcVideo.load(.formatDescriptions).first
    let vIn = AVAssetWriterInput(mediaType: .video, outputSettings: nil, sourceFormatHint: hint)
    let aIn = AVAssetWriterInput(mediaType: .audio, outputSettings: [
        AVFormatIDKey: kAudioFormatMPEG4AAC,
        AVSampleRateKey: 48000,
        AVNumberOfChannelsKey: 2,
        AVEncoderBitRateKey: 160_000,
    ])
    writer.add(vIn)
    writer.add(aIn)

    reader.startReading()
    writer.startWriting()
    writer.startSession(atSourceTime: .zero)

    let group = DispatchGroup()
    for (input, output, label) in [(vIn, vOut as AVAssetReaderOutput, "video"), (aIn, aOut as AVAssetReaderOutput, "audio")] {
        group.enter()
        let queue = DispatchQueue(label: label)
        input.requestMediaDataWhenReady(on: queue) {
            while input.isReadyForMoreMediaData {
                if let sample = output.copyNextSampleBuffer() {
                    if !input.append(sample) { fatalError("\(label) append failed: \(String(describing: writer.error))") }
                } else {
                    input.markAsFinished()
                    group.leave()
                    return
                }
            }
        }
    }
    await withCheckedContinuation { (done: CheckedContinuation<Void, Never>) in
        group.notify(queue: .global()) { done.resume() }
    }
    await writer.finishWriting()
    if writer.status != .completed { fatalError("writer failed: \(String(describing: writer.error))") }
    print("muxed \(lines.count) cue(s) → \(args[3])")
}

let done = DispatchSemaphore(value: 0)
Task {
    do { try await run() } catch { fputs("error: \(error)\n", stderr); exit(1) }
    done.signal()
}
done.wait()
