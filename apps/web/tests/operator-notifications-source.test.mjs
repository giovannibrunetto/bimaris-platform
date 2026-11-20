import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL(path,import.meta.url),"utf8");
const api=read("../app/api/operator/notifications/route.ts");
const bell=read("../app/area-operatore/OperatorNotificationBell.tsx");
const nav=read("../app/area-operatore/OperatorWorkspaceSwitcher.tsx");
const css=read("../app/area-operatore/operator-notification-bell.css");
const schema=read("../../../supabase/migrations/20261120142500_operator_notifications_center.sql");
const write=read("../lib/operator-notifications.ts");

test("notification GET and POST authorize membership before service-role read or write",()=>{
 assert.match(api,/client\.auth\.getClaims\(\)/);
 assert.match(api,/from\("operator_memberships"\).*?\.eq\("operator_id",operatorId\)\.eq\("user_id",userId\)/);
 assert.match(api,/if\("failure" in ctx\)return ctx\.failure/);
 assert.match(api,/\.eq\("operator_id",operatorId\)/);
 assert.match(api,/\.eq\("id",body\.notificationId\)/);
});
test("invalid notification mutations fail closed",()=>{
 assert.match(api,/body\?\.action!=="read"/);
 assert.match(api,/\["b2b","operator"\]/);
 assert.match(api,/\^\[\\da-f-\]\{36\}\$/);
});
test("notification sources are merged and activity-scoped with relative links",()=>{
 assert.match(api,/from\("operator_notifications"\)/);
 assert.match(api,/from\("b2b_match_notifications"\)/);
 assert.match(api,/url\.searchParams\.set\("operatore",operatorId\)/);
 assert.match(api,/\/area-operatore\/network-b2b\?operatore=/);
 assert.match(api,/Cache-Control":"no-store"/);
});
test("bell lives in shared operator switcher without duplicated inline banner",()=>{
 assert.match(nav,/<OperatorNotificationBell operatorId=\{active\.id\}\/>/);
 const page=read("../app/area-operatore/page.tsx");
 assert.doesNotMatch(page,/<B2BNewMatchAlerts/);
});
test("operator switches cannot display late responses from a different operator",()=>{
 assert.match(bell,/activeOperatorRef\.current!==operatorId/);
 assert.match(bell,/lastLoadRef\.current/);
 assert.match(bell,/activeOperatorRef\.current!==requestedOperatorId/);
});
test("bell supports unread count, mark read and dismiss actions",()=>{
 assert.match(bell,/operator-notice__badge/);
 assert.match(bell,/action:"read"/);
 assert.match(bell,/event\.key==="Escape"/);
 assert.match(bell,/aria-expanded=\{opened\}/);
});
test("mobile notification panel remains constrained to viewport",()=>{
 assert.match(css,/@media\(max-width:650px\)/);
 assert.match(css,/\.operator-notice__panel\{position:fixed;/);
 assert.match(css,/left:12px;right:12px;width:auto/);
});
test("notification database and service are idempotent and private",()=>{
 assert.match(schema,/unique\(operator_id,event_key\)/);
 assert.match(schema,/enable row level security/);
 assert.match(schema,/revoke all on public\.operator_notifications from anon,authenticated/);
 assert.match(write,/ignoreDuplicates:true/);
 assert.match(write,/target_path:path/);
});
