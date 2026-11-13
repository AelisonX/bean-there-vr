export type MenuButton={x:number,y:number,w:number,h:number,label:string,action:string};
export function menuButtons(page:'main'|'options'|'coop',paused:boolean,sound:boolean,assist:boolean,room?:{joined:boolean,host:boolean,count:number}):MenuButton[]{
 const row=(y:number,left:string,la:string,right:string,ra:string)=>[{x:32,y,w:464,h:76,label:left,action:la},{x:528,y,w:464,h:76,label:right,action:ra}];
 if(page==='coop')return [...row(240,room?.joined?(room.host?'START CO-OP':'WAITING FOR HOST'):'HOST / JOIN ROOM',room?.joined?(room.host&&room.count===2?'netstart':'none'):'roomform','LEAVE CO-OP','leave'),...row(340,'ROOM DETAILS','roomform','BACK','back')];
 return page==='main'?[...row(240,'90 SECOND SHIFT','timed','ENDLESS SHIFT','endless'),...row(340,'OPTIONS','options',paused?'RESUME SHIFT':'READY TO SORT',paused?'resume':'none'),...row(430,'CO-OP · TWO PLAYERS','coop','', 'none')]:[...row(230,`SOUND: ${sound?'ON':'OFF'}`,'sound',`BIN ASSIST: ${assist?'ON':'OFF'}`,'assist'),...row(330,'LOWER STATION','lower','RAISE STATION','raise'),...row(430,'BACK TO MODES','back',paused?'RESUME SHIFT':'CHOOSE A MODE',paused?'resume':'back')];
}
export function menuActionAt(buttons:MenuButton[],u:number,v:number){const x=u*1024,y=(1-v)*640;return buttons.find(b=>x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h)?.action;}
