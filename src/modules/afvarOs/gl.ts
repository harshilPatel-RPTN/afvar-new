// afvarOs/gl — everything that needs three.js: the 3D stage, the home's AI core,
// the material kit, the core nodes and the avatar. Kept apart from index.ts so a
// page only downloads three.js when it actually mounts a 3D scene.
export { CoreCanvas, SceneLabel, useStoryFrame, type CoreCanvasProps } from "./three/stage";
export { AiCore, CORE_SIZE, type CoreDrive } from "./three/AiCore";
export { AiSpark, GlassPlate, GlowLine, GoldDust, hdr } from "./three/kit";
export { CORE_NODE, CoreNodes, CorePulses, NearRange, orbitPlace, useCorePositions, useNearRange } from "./three/parts";
export { getAvatarRig, scheduleAvatarBuild, useAvatarRig, avatarFrame, AVATAR_HEIGHT, type AvatarFrame, type AvatarRig, type MotionName } from "./avatar/rig";
export { AvatarActor, AvatarOverlay, type AvatarTrack } from "./avatar/actors";
