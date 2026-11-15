/** Only actual player-thrown impacts call hit(). Sorting mistakes never provoke. */
export class Provocation {
 beans=0;pending:Array<{at:number,seat:number}>=[];
 reset(){this.beans=0;this.pending=[];}
 hit(fired:boolean,ko:boolean,mouse:boolean,seat:number,now:number){
  if(!fired||ko)return false;
  if(mouse||++this.beans>=3){this.reset();return true;}
  this.pending.push({at:now+.65,seat});return false;
 }
 take(now:number){const first=this.pending[0];return first&&first.at<=now?this.pending.shift():undefined;}
}
