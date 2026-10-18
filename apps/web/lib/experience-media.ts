export type ExistingExperienceMedia={kind:"existing";key:string;id:string;storagePath:string;url:string};
export type NewExperienceMedia={kind:"new";key:string;file:File;url:string};
export type ExperienceMediaItem=ExistingExperienceMedia|NewExperienceMedia;

export const MAX_EXPERIENCE_IMAGES=6;

export function existingMediaKey(id:string){
 return `existing:${id}`;
}

export function newMediaKey(file:File,index=0){
 const entropy=typeof crypto!=="undefined"&&"randomUUID" in crypto?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`;
 return `new:${entropy}:${index}:${file.name}`;
}

export function moveMediaItem<T>(items:T[],index:number,delta:number){
 const target=index+delta;
 if(index<0||index>=items.length||target<0||target>=items.length)return items;
 const next=[...items];
 [next[index],next[target]]=[next[target],next[index]];
 return next;
}

export function remainingMediaSlots(existingCount:number,newCount:number){
 return Math.max(0,MAX_EXPERIENCE_IMAGES-existingCount-newCount);
}

export function appendWithinMediaLimit<T>(current:T[],incoming:T[],existingCount:number){
 const available=remainingMediaSlots(existingCount,current.length);
 return {items:[...current,...incoming.slice(0,available)],rejectedCount:Math.max(0,incoming.length-available)};
}

export function removeMediaByKey<T extends {key:string}>(items:T[],key:string){
 return items.filter(item=>item.key!==key);
}

export function coverAfterRemoval<T extends {key:string}>(items:T[],removedKey:string,currentCoverKey:string|null){
 if(currentCoverKey!==removedKey)return currentCoverKey;
 return items.find(item=>item.key!==removedKey)?.key??null;
}

export function mergeMediaOrder(existing:ExistingExperienceMedia[],incoming:NewExperienceMedia[]){
 return [...existing,...incoming] as ExperienceMediaItem[];
}

export function reconcileMediaOrder(current:ExperienceMediaItem[],existing:ExistingExperienceMedia[],incoming:NewExperienceMedia[]){
 const available=new Map<string,ExperienceMediaItem>();
 for(const item of [...existing,...incoming])available.set(item.key,item);
 const next:ExperienceMediaItem[]=[];
 for(const item of current){const fresh=available.get(item.key);if(fresh){next.push(fresh);available.delete(item.key);}}
 for(const item of available.values())next.push(item);
 return next.slice(0,MAX_EXPERIENCE_IMAGES);
}

export function moveMediaByKey(items:ExperienceMediaItem[],key:string,delta:number){
 return moveMediaItem(items,items.findIndex(item=>item.key===key),delta);
}

export function effectiveCoverKey(items:ExperienceMediaItem[],coverKey:string|null){
 return coverKey&&items.some(item=>item.key===coverKey)?coverKey:items[0]?.key??null;
}

export function safeStorageFilename(index:number){
 const entropy=typeof crypto!=="undefined"&&"randomUUID" in crypto?crypto.randomUUID():Math.random().toString(36).slice(2,12);
 return `${Date.now()}-${index}-${entropy}.webp`;
}
