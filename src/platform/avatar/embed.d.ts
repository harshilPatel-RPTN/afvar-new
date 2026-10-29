// Vendored from https://github.com/Sudhakarrupnar/AFVAR_Avatar_Final (packages/avatar-embed v1.2.0).
export type AvatarGesture = 'idle'|'wave'|'talk'|'look'|'dance'|'listen'|'think'|'explain'|'pointLeft'|'pointRight'|'acknowledge'|'unsure'|'serious'|'celebrate';
export type AvatarEmotion = 'happy'|'neutral'|'curious'|'surprised'|'sad'|'thinking'|'focused'|'concerned'|'confident'|'empathetic';
export interface AvatarState { phase:string; emotion:string; gesture:string; visible:boolean }
export interface SkillCue { at:number; duration:number; viseme:string; amplitude?:number }
export interface SkillEventBase { version:1; turnId:string; /** Strictly increasing across this mounted session, including new turns. */ seq:number }
export type AvatarSkillEvent =
  | (SkillEventBase & {type:'turn.start'|'listening'|'thinking'|'speech.end'|'turn.end'|'cancel'})
  | (SkillEventBase & {type:'speech.start';audioClock?:number})
  | (SkillEventBase & {type:'behavior';text?:string;intent?:string;emotion?:AvatarEmotion;gesture?:AvatarGesture})
  | (SkillEventBase & {type:'speech.frame';audioClock?:number;amplitude?:number;cues?:SkillCue[]});
export interface AvatarSkillState {
  version:1;skillPackVersion:string;turnId:string|null;seq:number;phase:string;gesture:string;emotion:string;intent:string;
  speaking:boolean;mouth:number;mouthWidth:number;mouthHeight:number;hologramPhase:string;audioClock:number|null;
  paused:boolean;reducedMotion:boolean;cueCount:number;active:boolean;
  safety:{risk:boolean;distress:boolean;suppressPlay:boolean;negatedAffect:boolean};
}
export interface AvatarVoiceRequest { requestId:string;source:string;reason:string }
export interface AvatarCapabilities { aiMode:'demo'|'external';sendEvent:boolean;skillProtocolVersion:number|null;skillPackVersion:string }
export interface AvatarOptions {
  /** HTTPS viewer URL. Defaults to viewer/index.html beside the directly served ESM module. Bundled apps should set this explicitly. */
  viewerUrl?:string;
  /** /api/avatar by default, resolved on the viewer's origin. A separate HTTPS API must permit the viewer origin through CORS. */
  apiEndpoint?:string;
  /** External mode delegates all AI/microphone/audio work to the host; default demo uses the included AFVAR API. */
  aiMode?:'demo'|'external';
  onTalkRequest?:(request:AvatarVoiceRequest)=>void;
  onStopRequest?:(request:AvatarVoiceRequest)=>void;
  onSkillState?:(state:AvatarSkillState)=>void;
  title?:string;
  timeoutMs?:number;
  onReady?:(state:AvatarState)=>void;
  onState?:(state:AvatarState)=>void;
  onError?:(error:Error & {code?:string})=>void;
}
export interface AvatarController {
  ready:Promise<AvatarState>;
  readonly iframe:HTMLIFrameElement;
  readonly capabilities:AvatarCapabilities|null;
  /** External mode only; no raw audio. Resolves when the runtime accepts the bounded event. */
  sendEvent(event:AvatarSkillEvent):Promise<AvatarSkillState>;
  /** Call from an explicit user action. A browser may require its own in-frame Talk click/permission. */
  talk():Promise<AvatarState>;
  stop():Promise<AvatarState>;
  setState(value:{gesture?:AvatarGesture;emotion?:AvatarEmotion}):Promise<AvatarState>;
  /** Hiding stops voice. Showing does not automatically resume it. */
  setVisible(visible:boolean):Promise<AvatarState>;
  dispose():void;
}
export declare function mountAvatar(container:HTMLElement,options?:AvatarOptions):AvatarController;
