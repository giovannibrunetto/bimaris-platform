export type ExperienceMediaItem=
 | {kind:"existing";key:string;id:string;storagePath:string;url:string}
 | {kind:"new";key:string;file:File;url:string};

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

export function safeStorageFilename(index:number){
 return `${Date.now()}-${index}-${Math.random().toString(36).slice(2,10)}.webp`;
}
