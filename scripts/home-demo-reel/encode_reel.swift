// Encodes an ordered frame list into an H.264 MP4 with AVFoundation.
// A line is either a JPEG path, or "a.jpg|b.jpg|alpha" for a crossfade frame.
// Blended frames are also written as JPEGs to <blendDir>, and a fully
// resolved list (paths only) is written to <resolved.txt> for the WebM encode.
// usage: swift encode_reel.swift <frames.txt> <out.mp4> <w> <h> <fps> <bitrate> <blendDir> <resolved.txt>
import AVFoundation
import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

let args = CommandLine.arguments
guard args.count == 9, let w = Int(args[3]), let h = Int(args[4]), let fps = Int32(args[5]), let bitrate = Int(args[6]) else {
    fputs("usage: encode_reel <frames.txt> <out.mp4> <w> <h> <fps> <bitrate> <blendDir> <resolved.txt>\n", stderr)
    exit(2)
}
let lines = try String(contentsOfFile: args[1], encoding: .utf8).split(separator: "\n").map(String.init)
let outURL = URL(fileURLWithPath: args[2])
let blendDir = args[7]
try? FileManager.default.removeItem(at: outURL)
try FileManager.default.createDirectory(atPath: blendDir, withIntermediateDirectories: true)

var cache: [String: CGImage] = [:]
func load(_ p: String) -> CGImage {
    if let img = cache[p] { return img }
    guard let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: p) as CFURL, nil),
          let img = CGImageSourceCreateImageAtIndex(src, 0, nil) else { fatalError("bad frame \(p)") }
    if cache.count > 64 { cache.removeAll() }
    cache[p] = img
    return img
}

let writer = try AVAssetWriter(outputURL: outURL, fileType: .mp4)
writer.shouldOptimizeForNetworkUse = true
let input = AVAssetWriterInput(mediaType: .video, outputSettings: [
    AVVideoCodecKey: AVVideoCodecType.h264,
    AVVideoWidthKey: w,
    AVVideoHeightKey: h,
    AVVideoCompressionPropertiesKey: [
        AVVideoAverageBitRateKey: bitrate,
        AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
        AVVideoMaxKeyFrameIntervalKey: Int(fps) * 2,
    ],
])
input.expectsMediaDataInRealTime = false
let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: [
    kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
    kCVPixelBufferWidthKey as String: w,
    kCVPixelBufferHeightKey as String: h,
])
writer.add(input)
writer.startWriting()
writer.startSession(atSourceTime: .zero)

var resolved: [String] = []
let rect = CGRect(x: 0, y: 0, width: w, height: h)
for (i, line) in lines.enumerated() {
    while !input.isReadyForMoreMediaData { usleep(2000) }
    var buffer: CVPixelBuffer?
    CVPixelBufferPoolCreatePixelBuffer(nil, adaptor.pixelBufferPool!, &buffer)
    guard let pb = buffer else { fatalError("no buffer") }
    CVPixelBufferLockBaseAddress(pb, [])
    let ctx = CGContext(
        data: CVPixelBufferGetBaseAddress(pb), width: w, height: h, bitsPerComponent: 8,
        bytesPerRow: CVPixelBufferGetBytesPerRow(pb), space: CGColorSpaceCreateDeviceRGB(),
        bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue)!
    let parts = line.split(separator: "|").map(String.init)
    if parts.count == 3, let alpha = Double(parts[2]) {
        ctx.draw(load(parts[0]), in: rect)
        ctx.setAlpha(CGFloat(alpha))
        ctx.draw(load(parts[1]), in: rect)
        ctx.setAlpha(1)
        // Persist the blended frame for the WebM encode.
        let blended = ctx.makeImage()!
        let path = "\(blendDir)/b\(String(format: "%06d", i)).jpg"
        let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: path) as CFURL, UTType.jpeg.identifier as CFString, 1, nil)!
        CGImageDestinationAddImage(dest, blended, [kCGImageDestinationLossyCompressionQuality: 0.92] as CFDictionary)
        CGImageDestinationFinalize(dest)
        resolved.append(path)
    } else {
        ctx.draw(load(line), in: rect)
        resolved.append(line)
    }
    CVPixelBufferUnlockBaseAddress(pb, [])
    if !adaptor.append(pb, withPresentationTime: CMTime(value: CMTimeValue(i), timescale: fps)) {
        fatalError("append failed at \(i): \(String(describing: writer.error))")
    }
}
input.markAsFinished()
let done = DispatchSemaphore(value: 0)
writer.finishWriting { done.signal() }
done.wait()
if writer.status != .completed { fatalError("writer failed: \(String(describing: writer.error))") }
try (resolved.joined(separator: "\n") + "\n").write(toFile: args[8], atomically: true, encoding: .utf8)
print("wrote \(lines.count) frames → \(args[2])")
