export type Button='trigger'|'grip';
export class HandLoad<T extends {critter:boolean}> {
 buttons=new Set<Button>();slots:Partial<Record<Button,T>>={};mouse:T|undefined;
 get items(){return this.mouse?[this.mouse]:Object.values(this.slots) as T[];}
 press(button:Button,find:(mouse:boolean)=>T|undefined){
  this.buttons.add(button);if(this.mouse)return;
  if(this.buttons.size===2&&this.items.length===0){const mouse=find(true);if(mouse?.critter){this.mouse=mouse;return mouse;}}
  if(!this.slots[button]){const bean=find(false);if(bean&&!bean.critter&&!this.items.includes(bean)){this.slots[button]=bean;return bean;}}
 }
 release(button:Button){this.buttons.delete(button);if(this.mouse){const b=this.mouse;this.mouse=undefined;return b;}const b=this.slots[button];delete this.slots[button];return b;}
 clear(){const items=this.items;this.slots={};this.mouse=undefined;this.buttons.clear();return items;}
}
