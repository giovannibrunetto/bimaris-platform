import test from "node:test";
import assert from "node:assert/strict";
import {uploadExperienceMedia,uploadRevisionMedia} from "../lib/experience-media-persistence.ts";

function fakeMediaClient({failUploadAt=0,failInsertAt=0,failSignedAt=0}={}){
 const uploads=[];const deletes=[];const rows=[];let attempt=0;let insertCount=0;let signedCount=0;
 const client={
  storage:{from(bucket){return{
   async upload(path,file,options){attempt++;if(attempt===failUploadAt)return {error:{message:"simulated upload failure"}};uploads.push({bucket,path,file,options});return {error:null};},
   async remove(paths){deletes.push({bucket,paths});return {error:null};},
   getPublicUrl(path){return {data:{publicUrl:`https://staging.example.test/storage/v1/object/public/${bucket}/${path}`}};},
   async createSignedUrl(path){signedCount++;return signedCount===failSignedAt?{data:null,error:{message:"simulated signed URL failure"}}:{data:{signedUrl:`https://staging.example.test/private/${path}`},error:null};}
  }}},
  from(table){return {
   insert(row){insertCount++;return {select(){return {async single(){if(insertCount===failInsertAt)return {data:null,error:{message:"simulated database failure"}};rows.push({table,...row});return {data:{id:`row-${insertCount}`},error:null};}}}};},
   delete(){return {eq(){return Promise.resolve({error:null})}};}
  }}
 };
 return {client,uploads,deletes,rows};
}
const fakeFile=name=>({name,type:"image/webp",size:110});

test("one, three, and six photographs persist individually",async()=>{
 for(const count of [1,3,6]){
  const {client,uploads,rows}=fakeMediaClient();
  for(let i=0;i<count;i++){
   const result=await uploadExperienceMedia(client,{experienceId:"exp",operatorId:"op",file:fakeFile(`photo-${i}`),storageFilename:`photo-${i}.webp`,sortOrder:i,altText:`Foto ${i+1}`});
   assert.equal(result.ok,true);
  }
  assert.equal(uploads.length,count);assert.equal(rows.length,count);
  assert.equal(new Set(uploads.map(x=>x.path)).size,count);
  assert.ok(rows.every(row=>row.table==="experience_media"));
 }
});

test("failure uploading third photo preserves two earlier database associations",async()=>{
 const {client,uploads,rows}=fakeMediaClient({failUploadAt:3});
 const results=[];
 for(let i=0;i<3;i++)results.push(await uploadExperienceMedia(client,{experienceId:"exp",operatorId:"op",file:fakeFile(`photo-${i}`),storageFilename:`photo-${i}.webp`,sortOrder:i,altText:"Fotografia"}));
 assert.deepEqual(results.map(x=>x.ok),[true,true,false]);
 assert.equal(results[2].reason,"upload");assert.equal(uploads.length,2);assert.equal(rows.length,2);
});

test("failed association removes only the uploaded orphan",async()=>{
 const {client,uploads,deletes,rows}=fakeMediaClient({failInsertAt:3});
 const results=[];
 for(let i=0;i<3;i++)results.push(await uploadExperienceMedia(client,{experienceId:"exp",operatorId:"op",file:fakeFile(`photo-${i}`),storageFilename:`photo-${i}.webp`,sortOrder:i,altText:"Fotografia"}));
 assert.deepEqual(results.map(x=>x.ok),[true,true,false]);assert.equal(results[2].reason,"database");
 assert.equal(rows.length,2);assert.equal(uploads.length,3);
 assert.deepEqual(deletes,[{bucket:"experience-media",paths:["op/exp/photo-2.webp"]}]);
});

test("private revision photos remain private and use signed URLs",async()=>{
 const {client,uploads,rows}=fakeMediaClient();
 for(let i=0;i<3;i++){
  const r=await uploadRevisionMedia(client,{revisionId:"rev",operatorId:"op",file:fakeFile(`photo-${i}`),storageFilename:`photo-${i}.webp`,sortOrder:i,altText:"Fotografia"});
  assert.equal(r.ok,true);assert.match(r.url,/\/private\//);
 }
 assert.ok(uploads.every(x=>x.bucket==="experience-revision-media"));
 assert.ok(rows.every(x=>x.table==="experience_revision_media"));
});

test("signed URL error cleans up newly uploaded private object",async()=>{
 const {client,deletes}=fakeMediaClient({failSignedAt:1});
 const result=await uploadRevisionMedia(client,{revisionId:"rev",operatorId:"op",file:fakeFile("photo"),storageFilename:"photo.webp",sortOrder:0,altText:"Fotografia"});
 assert.equal(result.ok,false);assert.equal(result.reason,"signed-url");
 assert.deepEqual(deletes,[{bucket:"experience-revision-media",paths:["op/revisions/rev/photo.webp"]}]);
});
