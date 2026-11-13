import * as T from 'three';
// Layers 1/2 are used by Three.js XR stereo eyes; keep own-avatar proxies on 31.
export const LOCAL_AVATAR_PROXY_LAYER=31;
export class Avatars {
 vr=new T.Group();robot=new T.Group();vrHead:T.Mesh;robotHead:T.Mesh;glove=new T.Group();arm:T.Mesh;fallTime=-1;
 private cameraPosition:T.Vector3;private cameraRotation:T.Quaternion;
 constructor(scene:T.Scene,private camera:T.PerspectiveCamera){
  const cube=new T.BoxGeometry(1,1,1),sphere=new T.SphereGeometry(1,10,8),blue=new T.MeshStandardMaterial({color:'#247ed1'}),steel=new T.MeshStandardMaterial({color:'#8eaaa8'}),vest=new T.MeshStandardMaterial({color:'#3b8073'});
  const box=(g:T.Object3D,p:number[],s:number[],m:T.Material)=>{const mesh=new T.Mesh(cube,m);mesh.position.fromArray(p);mesh.scale.fromArray(s);g.add(mesh);return mesh;};
  box(this.vr,[0,-.45,0],[.34,.55,.23],vest);this.vrHead=new T.Mesh(sphere,steel);this.vrHead.scale.set(.12,.15,.12);this.vr.add(this.vrHead);this.vr.traverse(o=>o.layers.set(LOCAL_AVATAR_PROXY_LAYER));scene.add(this.vr);
  box(this.robot,[0,.7,0],[.36,.48,.26],steel);box(this.robot,[0,.7,.14],[.24,.15,.025],vest);this.robotHead=box(this.robot,[0,1.12,0],[.29,.24,.25],steel);this.robotHead.layers.set(LOCAL_AVATAR_PROXY_LAYER);this.robot.position.set(0,0,.7);scene.add(this.robot);
  box(this.glove,[0,0,0],[.09,.04,.09],blue);for(let i=0;i<4;i++)box(this.glove,[(i-1.5)*.022,0,-.055],[.018,.03,.055],blue);box(this.glove,[-.055,0,0],[.03,.035,.05],blue);scene.add(this.glove);this.glove.position.set(0,1.08,-.3);
  this.arm=new T.Mesh(new T.CylinderGeometry(.018,.018,1,8),steel);scene.add(this.arm);this.cameraPosition=camera.position.clone();this.cameraRotation=camera.quaternion.clone();
 }
 reset(){this.fallTime=-1;this.camera.position.copy(this.cameraPosition);this.camera.quaternion.copy(this.cameraRotation);this.robot.rotation.set(0,0,0);this.robot.position.set(0,0,.7);}
 fall(){if(this.fallTime<0)this.fallTime=0;}
 update(dt:number,immersive:boolean,headPosition:T.Vector3,headRotation:T.Quaternion){
  this.vr.visible=immersive;this.robot.visible=this.glove.visible=this.arm.visible=!immersive;
  if(this.fallTime>=0)this.fallTime+=dt;const fall=this.fallTime<0?0:T.MathUtils.smoothstep(this.fallTime,0,1);
  if(immersive){this.vr.position.copy(headPosition);this.vr.rotation.set(0,new T.Euler().setFromQuaternion(headRotation,'YXZ').y,fall*Math.PI/2);this.vr.position.y-=fall*Math.max(0,headPosition.y-.18);if(fall===0)this.vrHead.quaternion.copy(this.vr.quaternion).invert().multiply(headRotation);else this.vrHead.quaternion.identity();}
  else{this.robot.rotation.z=fall*Math.PI/2;this.robot.position.y=fall*.18;if(fall>0){this.glove.position.y=1.08-fall*.9;this.camera.position.y=this.cameraPosition.y-fall*.6;this.camera.quaternion.copy(this.cameraRotation).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),fall*.22));}}
  // Camera remains fully tracked in VR; only the avatar falls.
  const shoulder=this.robot.localToWorld(new T.Vector3(.22,.85,0)),end=this.glove.position;this.arm.position.copy(shoulder).lerp(end,.5);this.arm.scale.y=Math.max(.01,shoulder.distanceTo(end));this.arm.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),end.clone().sub(shoulder).normalize());
 }
}
