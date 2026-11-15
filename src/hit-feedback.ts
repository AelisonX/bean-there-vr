import * as T from 'three';
/** Peripheral short-lived marks, without camera shake or a full-screen flash. */
export class HitFeedback {
 root=new T.Group();material=new T.MeshBasicMaterial({color:'#f16b58',transparent:true,opacity:0,depthTest:false,depthWrite:false,toneMapped:false});remaining=0;
 constructor(scene:T.Scene){for(const x of [-1,1])for(const y of [-1,1]){for(const vertical of [false,true]){const mesh=new T.Mesh(new T.PlaneGeometry(vertical?.006:.055,vertical?.04:.006),this.material);mesh.position.set(x*(vertical?.19:.165),y*(vertical?.11:.13),0);mesh.renderOrder=1000;mesh.frustumCulled=false;this.root.add(mesh);}}this.root.visible=false;scene.add(this.root);}
 trigger(){this.remaining=.6;}
 reset(){this.remaining=0;this.root.visible=false;}
 update(dt:number,head:T.Vector3,rotation:T.Quaternion){this.remaining=Math.max(0,this.remaining-dt);this.root.visible=this.remaining>0;this.material.opacity=.32*Math.min(1,this.remaining/.45);this.root.position.copy(head).add(new T.Vector3(0,0,-.4).applyQuaternion(rotation));this.root.quaternion.copy(rotation);}
}
