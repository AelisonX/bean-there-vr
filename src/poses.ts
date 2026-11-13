import * as T from 'three';
// XR camera.position/quaternion are in reference-space coordinates. Its transient
// matrixWorld is renderer-owned and is not a safe Object3D world-pose source.
export function xrHeadPose(rig:T.Object3D,trackedCamera:T.Object3D){
 rig.updateWorldMatrix(true,false);
 return {position:trackedCamera.position.clone().applyMatrix4(rig.matrixWorld),
 rotation:rig.getWorldQuaternion(new T.Quaternion()).multiply(trackedCamera.quaternion)};
}
