module.exports=[18622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},56704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},24725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},70406,(e,t,r)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},93695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},54799,(e,t,r)=>{t.exports=e.x("crypto",()=>require("crypto"))},88947,(e,t,r)=>{t.exports=e.x("stream",()=>require("stream"))},46786,(e,t,r)=>{t.exports=e.x("os",()=>require("os"))},22734,(e,t,r)=>{t.exports=e.x("fs",()=>require("fs"))},4446,(e,t,r)=>{t.exports=e.x("net",()=>require("net"))},55004,(e,t,r)=>{t.exports=e.x("tls",()=>require("tls"))},60438,(e,t,r)=>{t.exports=e.x("perf_hooks",()=>require("perf_hooks"))},48964,e=>{"use strict";e.s(["corsHeaders",0,{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET, POST, PUT, DELETE, OPTIONS","Access-Control-Allow-Headers":"Content-Type, Authorization"}])},11799,e=>{"use strict";e.s(["reviveDates",()=>function e(t){if(Array.isArray(t))return t.map(t=>e(t));if(null!==t&&"object"==typeof t){let e={};for(let[s,o]of Object.entries(t)){var r;"string"==typeof(r=o)&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{300}Z$/.test(r)?e[s]=new Date(o):e[s]=o}return e}return t}])},57845,e=>{"use strict";var t=e.i(36674),r=e.i(41118),s=e.i(59617),o=e.i(52171),n=e.i(43408),a=e.i(67620),i=e.i(82397),l=e.i(27688),u=e.i(75897),d=e.i(96582),p=e.i(47308),c=e.i(18505),E=e.i(84130),f=e.i(26866),x=e.i(77048),R=e.i(93695);e.i(3348);var h=e.i(76390),_=e.i(52716),C=e.i(48964),O=e.i(66151),m=e.i(11799);async function w(e,t){try{let{username:e}=await t.params;if(!e)return _.NextResponse.json({error:"Username is required"},{status:400,headers:C.corsHeaders});let r=await O.default`
      SELECT user_id::text AS user_id
      FROM ssu_users
      WHERE username = ${e}
      LIMIT 1
    `;if(0===r.length)return _.NextResponse.json({error:"User not found"},{status:404,headers:C.corsHeaders});let s=r[0].user_id,o=await O.default`
      WITH user_target AS (
        SELECT user_id
        FROM ssu_users
        WHERE username = ${e}
      )
      SELECT
        p.post_id::text AS "_id",
        p.content,
        p.image_uri AS "imageUri",
        p.created_at AS "date",
        u.username,
        u.user_id::text as "userid",
        COALESCE(u.profile_image, 'https://ssusocial.s3.amazonaws.com/profilepictures/ProfileIcon.png') AS "profileImage",
        COALESCE(l.like_count, 0) AS "likeCount",
        COALESCE(c.comment_count, 0) AS "commentCount",
        COALESCE(v.view_count, 0) AS "viewCount",
        COALESCE(fol.follower_count, 0) AS "followerCount",
        COALESCE(fow.following_count, 0) AS "followingCount",
        CASE WHEN ul.user_id IS NOT NULL THEN true ELSE false END AS "isLiked"
      FROM posts p
      JOIN ssu_users u ON p.user_id = u.user_id


      LEFT JOIN (
        SELECT post_id, COUNT(*)::int AS like_count
        FROM likes
        GROUP BY post_id
      ) l ON l.post_id = p.post_id

      LEFT JOIN (
        SELECT post_id, COUNT(*)::int AS comment_count
        FROM comments
        GROUP BY post_id
      ) c ON c.post_id = p.post_id

      LEFT JOIN (
        SELECT post_id, COUNT(*)::int AS view_count
        FROM views
        GROUP BY post_id
      ) v ON v.post_id = p.post_id

      -- Followers count of the post author
      LEFT JOIN (
        SELECT user_id, COUNT(*)::int AS follower_count
        FROM followers
        GROUP BY user_id
      ) fol ON fol.user_id = p.user_id

      -- Following count of the post author
      LEFT JOIN (
        SELECT follower_id AS user_id, COUNT(*)::int AS following_count
        FROM followers
        GROUP BY follower_id
      ) fow ON fow.user_id = p.user_id      

      -- Check if current user liked the post
      LEFT JOIN likes ul
        ON ul.post_id = p.post_id
        AND ul.user_id = (
          SELECT user_id
          FROM ssu_users
          WHERE username = ${e} 
          LIMIT 1
        )
  
      ORDER BY p.created_at DESC
    `,n=(0,m.reviveDates)(o);return o.length>0&&await O.default`
        INSERT INTO views (user_id, post_id)
        SELECT ${s}::uuid, p.post_id
        FROM posts p
        WHERE p.user_id = ${s}::uuid
        ORDER BY p.created_at DESC
        ON CONFLICT (user_id, post_id) DO NOTHING
      `,_.NextResponse.json(n,{status:200,headers:C.corsHeaders})}catch(e){return console.error("Feed error:",e),_.NextResponse.json({error:"Failed to load feed."},{status:500,headers:C.corsHeaders})}}e.s(["GET",()=>w],36189);var v=e.i(36189);let A=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/feed/[username]/route",pathname:"/api/feed/[username]",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/app/api/feed/[username]/route.ts",nextConfigOutput:"",userland:v}),{workAsyncStorage:T,workUnitAsyncStorage:S,serverHooks:g}=A;function N(){return(0,s.patchFetch)({workAsyncStorage:T,workUnitAsyncStorage:S})}async function y(e,t,s){A.isDev&&(0,o.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let _="/api/feed/[username]/route";_=_.replace(/\/index$/,"")||"/";let C=await A.prepare(e,t,{srcPage:_,multiZoneDraftMode:!1});if(!C)return t.statusCode=400,t.end("Bad Request"),null==s.waitUntil||s.waitUntil.call(s,Promise.resolve()),null;let{buildId:O,params:m,nextConfig:w,parsedUrl:v,isDraftMode:T,prerenderManifest:S,routerServerContext:g,isOnDemandRevalidate:N,revalidateOnlyGenerated:y,resolvedPathname:I,clientReferenceManifest:L,serverActionsManifest:P}=C,k=(0,i.normalizeAppPath)(_),H=!!(S.dynamicRoutes[k]||S.routes[I]),U=async()=>((null==g?void 0:g.render404)?await g.render404(e,t,v,!1):t.end("This page could not be found"),null);if(H&&!T){let e=!!S.routes[I],t=S.dynamicRoutes[k];if(t&&!1===t.fallback&&!e){if(w.experimental.adapterPath)return await U();throw new R.NoFallbackError}}let b=null;!H||A.isDev||T||(b="/index"===(b=I)?"/":b);let F=!0===A.isDev||!H,q=H&&!F;P&&L&&(0,a.setManifestsSingleton)({page:_,clientReferenceManifest:L,serverActionsManifest:P});let M=e.method||"GET",D=(0,n.getTracer)(),j=D.getActiveScopeSpan(),$={params:m,prerenderManifest:S,renderOpts:{experimental:{authInterrupts:!!w.experimental.authInterrupts},cacheComponents:!!w.cacheComponents,supportsDynamicResponse:F,incrementalCache:(0,o.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:w.cacheLife,waitUntil:s.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,s,o)=>A.onRequestError(e,t,s,o,g)},sharedContext:{buildId:O}},B=new l.NodeNextRequest(e),G=new l.NodeNextResponse(t),K=u.NextRequestAdapter.fromNodeNextRequest(B,(0,u.signalFromNodeResponse)(t));try{let a=async e=>A.handle(K,$).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=D.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==d.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let s=r.get("next.route");if(s){let t=`${M} ${s}`;e.setAttributes({"next.route":s,"http.route":s,"next.span_name":t}),e.updateName(t)}else e.updateName(`${M} ${_}`)}),i=!!(0,o.getRequestMeta)(e,"minimalMode"),l=async o=>{var n,l;let u=async({previousCacheEntry:r})=>{try{if(!i&&N&&y&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let n=await a(o);e.fetchMetrics=$.renderOpts.fetchMetrics;let l=$.renderOpts.pendingWaitUntil;l&&s.waitUntil&&(s.waitUntil(l),l=void 0);let u=$.renderOpts.collectedTags;if(!H)return await (0,c.sendResponse)(B,G,n,$.renderOpts.pendingWaitUntil),null;{let e=await n.blob(),t=(0,E.toNodeOutgoingHttpHeaders)(n.headers);u&&(t[x.NEXT_CACHE_TAGS_HEADER]=u),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==$.renderOpts.collectedRevalidate&&!($.renderOpts.collectedRevalidate>=x.INFINITE_CACHE)&&$.renderOpts.collectedRevalidate,s=void 0===$.renderOpts.collectedExpire||$.renderOpts.collectedExpire>=x.INFINITE_CACHE?void 0:$.renderOpts.collectedExpire;return{value:{kind:h.CachedRouteKind.APP_ROUTE,status:n.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:s}}}}catch(t){throw(null==r?void 0:r.isStale)&&await A.onRequestError(e,t,{routerKind:"App Router",routePath:_,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:q,isOnDemandRevalidate:N})},!1,g),t}},d=await A.handleResponse({req:e,nextConfig:w,cacheKey:b,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:S,isRoutePPREnabled:!1,isOnDemandRevalidate:N,revalidateOnlyGenerated:y,responseGenerator:u,waitUntil:s.waitUntil,isMinimalMode:i});if(!H)return null;if((null==d||null==(n=d.value)?void 0:n.kind)!==h.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==d||null==(l=d.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});i||t.setHeader("x-nextjs-cache",N?"REVALIDATED":d.isMiss?"MISS":d.isStale?"STALE":"HIT"),T&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let R=(0,E.fromNodeOutgoingHttpHeaders)(d.value.headers);return i&&H||R.delete(x.NEXT_CACHE_TAGS_HEADER),!d.cacheControl||t.getHeader("Cache-Control")||R.get("Cache-Control")||R.set("Cache-Control",(0,f.getCacheControlHeader)(d.cacheControl)),await (0,c.sendResponse)(B,G,new Response(d.value.body,{headers:R,status:d.value.status||200})),null};j?await l(j):await D.withPropagatedContext(e.headers,()=>D.trace(d.BaseServerSpan.handleRequest,{spanName:`${M} ${_}`,kind:n.SpanKind.SERVER,attributes:{"http.method":M,"http.target":e.url}},l))}catch(t){if(t instanceof R.NoFallbackError||await A.onRequestError(e,t,{routerKind:"App Router",routePath:k,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:q,isOnDemandRevalidate:N})},!1,g),H)throw t;return await (0,c.sendResponse)(B,G,new Response(null,{status:500})),null}}e.s(["handler",()=>y,"patchFetch",()=>N,"routeModule",()=>A,"serverHooks",()=>g,"workAsyncStorage",()=>T,"workUnitAsyncStorage",()=>S],57845)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__d506034d._.js.map