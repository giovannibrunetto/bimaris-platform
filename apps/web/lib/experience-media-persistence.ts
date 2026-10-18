type MediaClient={
 from:(table:string)=>any;
 storage:{from:(bucket:string)=>any};
};

type UploadInput={
 experienceId:string;
 operatorId:string;
 file:File;
 storageFilename:string;
 sortOrder:number;
 altText:string;
};

export async function deleteExperienceMedia(client:MediaClient,experienceId:string,paths:string[]){
 if(!paths.length)return {ok:true as const,storageWarning:false};
 const unique=[...new Set(paths)];
 const db=await client.from("experience_media").delete().eq("experience_id",experienceId).in("storage_path",unique);
 if(db.error)return {ok:false as const,reason:"database" as const,error:db.error};
 const storage=await client.storage.from("experience-media").remove(unique);
 return {ok:true as const,storageWarning:Boolean(storage.error),error:storage.error??null};
}

export async function uploadExperienceMedia(client:MediaClient,input:UploadInput){
 const path=`${input.operatorId}/${input.experienceId}/${input.storageFilename}`;
 const upload=await client.storage.from("experience-media").upload(path,input.file,{upsert:false,contentType:"image/webp"});
 if(upload.error)return {ok:false as const,reason:"upload" as const,error:upload.error};
 const inserted=await client.from("experience_media").insert({
  experience_id:input.experienceId,
  storage_path:path,
  sort_order:input.sortOrder,
  is_cover:false,
  alt_text:input.altText,
 }).select("id").single();
 if(inserted.error||!inserted.data){
  const cleanup=await client.storage.from("experience-media").remove([path]);
  return {ok:false as const,reason:"database" as const,error:inserted.error,cleanupFailed:Boolean(cleanup.error)};
 }
 const url=client.storage.from("experience-media").getPublicUrl(path).data.publicUrl as string;
 return {ok:true as const,id:inserted.data.id as string,storagePath:path,url};
}
