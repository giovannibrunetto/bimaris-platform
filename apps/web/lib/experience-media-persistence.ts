type MediaClient={
 from:(table:string)=>any;
 storage:{from:(bucket:string)=>any};
};

type UploadInput={experienceId:string;operatorId:string;file:File;storageFilename:string;sortOrder:number;altText:string};
type RevisionUploadInput={revisionId:string;operatorId:string;file:File;storageFilename:string;sortOrder:number;altText:string};
type LiveMediaDeleteItem={id:string;storagePath:string};

const LIVE_MEDIA_BUCKET="experience-media";
const REVISION_MEDIA_BUCKET="experience-revision-media";
const REVISION_URL_TTL_SECONDS=300;

export async function deleteExperienceMedia(client:MediaClient,experienceId:string,paths:string[]):Promise<any>;
export async function deleteExperienceMedia(client:MediaClient,item:LiveMediaDeleteItem):Promise<any>;
export async function deleteExperienceMedia(client:MediaClient,experienceOrItem:string|LiveMediaDeleteItem,paths?:string[]){
 if(typeof experienceOrItem!=="string"){
  const item=experienceOrItem;
  const db=await client.from("experience_media").delete().eq("id",item.id).eq("storage_path",item.storagePath);
  if(db.error)return {ok:false as const,reason:"database" as const,error:db.error};
  const storage=await client.storage.from(LIVE_MEDIA_BUCKET).remove([item.storagePath]);
  return {ok:true as const,storageWarning:Boolean(storage.error),error:storage.error??null};
 }
 if(!paths?.length)return {ok:true as const,storageWarning:false};
 const unique=[...new Set(paths)];
 const db=await client.from("experience_media").delete().eq("experience_id",experienceOrItem).in("storage_path",unique);
 if(db.error)return {ok:false as const,reason:"database" as const,error:db.error};
 const storage=await client.storage.from(LIVE_MEDIA_BUCKET).remove(unique);
 return {ok:true as const,storageWarning:Boolean(storage.error),error:storage.error??null};
}

export async function uploadExperienceMedia(client:MediaClient,input:UploadInput){
 const path=`${input.operatorId}/${input.experienceId}/${input.storageFilename}`;
 const upload=await client.storage.from(LIVE_MEDIA_BUCKET).upload(path,input.file,{upsert:false,contentType:"image/webp"});
 if(upload.error)return {ok:false as const,reason:"upload" as const,error:upload.error};
 const inserted=await client.from("experience_media").insert({experience_id:input.experienceId,storage_path:path,sort_order:input.sortOrder,is_cover:false,alt_text:input.altText}).select("id").single();
 if(inserted.error||!inserted.data){const cleanup=await client.storage.from(LIVE_MEDIA_BUCKET).remove([path]);return {ok:false as const,reason:"database" as const,error:inserted.error,cleanupFailed:Boolean(cleanup.error)};}
 const url=client.storage.from(LIVE_MEDIA_BUCKET).getPublicUrl(path).data.publicUrl as string;
 return {ok:true as const,id:inserted.data.id as string,storagePath:path,url};
}

// Revision media is private until an admin approves and promotes the revision.
export async function uploadRevisionMedia(client:MediaClient,input:RevisionUploadInput){
 const path=`${input.operatorId}/revisions/${input.revisionId}/${input.storageFilename}`;
 const upload=await client.storage.from(REVISION_MEDIA_BUCKET).upload(path,input.file,{upsert:false,contentType:"image/webp"});
 if(upload.error)return {ok:false as const,reason:"upload" as const,error:upload.error};
 const inserted=await client.from("experience_revision_media").insert({revision_id:input.revisionId,operator_id:input.operatorId,source_media_id:null,storage_path:path,sort_order:input.sortOrder,is_cover:false,alt_text:input.altText}).select("id").single();
 if(inserted.error||!inserted.data){const cleanup=await client.storage.from(REVISION_MEDIA_BUCKET).remove([path]);return {ok:false as const,reason:"database" as const,error:inserted.error,cleanupFailed:Boolean(cleanup.error)};}
 const signed=await client.storage.from(REVISION_MEDIA_BUCKET).createSignedUrl(path,REVISION_URL_TTL_SECONDS);
 if(signed.error||!signed.data?.signedUrl){await client.from("experience_revision_media").delete().eq("id",inserted.data.id);const cleanup=await client.storage.from(REVISION_MEDIA_BUCKET).remove([path]);return {ok:false as const,reason:"signed-url" as const,error:signed.error,cleanupFailed:Boolean(cleanup.error)};}
 return {ok:true as const,id:inserted.data.id as string,storagePath:path,url:signed.data.signedUrl as string};
}

// Removing a snapshot row must not delete the original live file. Only newly uploaded revision files are removed from private storage.
export async function deleteRevisionMedia(client:MediaClient,revisionId:string,item:{id:string;storagePath:string;sourceMediaId:string|null}){
 const db=await client.from("experience_revision_media").delete().eq("id",item.id).eq("revision_id",revisionId);
 if(db.error)return {ok:false as const,reason:"database" as const,error:db.error};
 if(item.sourceMediaId)return {ok:true as const,storageWarning:false};
 const storage=await client.storage.from(REVISION_MEDIA_BUCKET).remove([item.storagePath]);
 return {ok:true as const,storageWarning:Boolean(storage.error),error:storage.error??null};
}
