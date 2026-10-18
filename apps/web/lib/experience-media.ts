export type ExistingExperienceMedia={kind:"existing";key:string;id:string;storagePath:string;url:string};
export type NewExperienceMedia={kind:"new";key:string;file:File;url:string};
export type ExperienceMediaItem=ExistingExperienceMedia|NewExperienceMedia;

export const MAX_EXPERIENCE_IMAGES=6;

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

export function safeStorageFilename(index:number){
 const entropy=typeof crypto!=="undefined"&&"randomUUID" in crypto?crypto.randomUUID():Math.random().toString(36).slice(2,12);
 return `${Date.now()}-${index}-${entropy}.webp`;
}
