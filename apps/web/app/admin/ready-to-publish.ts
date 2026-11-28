/* Single definition of "ready to publish" shared by the admin dashboard and register.
   Keep approval and publication separate; never mutate content from a counter. */
export type ReadyExperience = {
 id:string;
 review_status:string;
 published:boolean;
 experience_origin:string;
 operator: {published:boolean}|{published:boolean}[]|null;
};
export type ReadyAppointment = {verification_status:string;published:boolean};
export function isReadyExperience(item:ReadyExperience,pendingRevisionIds:ReadonlySet<string>):boolean {
 const operator=Array.isArray(item.operator)?item.operator[0]:item.operator;
 return item.review_status==="approved"&&!item.published
  &&!pendingRevisionIds.has(item.id)
  &&(item.experience_origin==="bimaris"||operator?.published===true);
}
export function isReadyAppointment(item:ReadyAppointment):boolean {
 return item.verification_status==="verified"&&!item.published;
}
