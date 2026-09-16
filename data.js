/* Exact ERD field names; unmodelled SOW requirements live under extensions. */
window.HammerSeed = function () {
  const iso=new Date().toISOString();
  const date=days=>{const d=new Date();d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);};
  const sources=[
    {id:1,source_code:'TOKYO_STUDIO',provider:'admin',url:'https://example.com/tokyo/auditions',country:'Japan',city:'Tokyo',priority:1,enabled:true,crawl_status:'success',last_http_status:200,notes:'Public audition listings'},
    {id:2,source_code:'SG_DANCE',provider:'dancer',url:'https://example.org/sg/jobs',country:'Singapore',city:'Singapore',priority:2,enabled:true,crawl_status:'failed',last_http_status:503,error_message:'Source temporarily unavailable',notes:'Retry after the source recovers'},
    {id:3,source_code:'OSAKA_STAGE',provider:'ai_keyword',url:'https://example.net/osaka/casting',country:'Japan',city:'Osaka',priority:3,enabled:false,crawl_status:'skipped',last_http_status:null,notes:'Paused by administrator'}
  ].map(s=>({normalized_url:s.url,last_crawled_at:iso,next_crawl_at:null,crawl_count:1,failed_count:0,unchanged_count:0,error_message:null,...s}));
  const opportunities=[
    {id:101,source_link_id:1,title:'Choreographer for a weekend dance camp',organization:'Tokyo Movement Studio',opportunity_type:'workshop',description:'Lead a small-group choreography workshop. Two rehearsal days and one teaching day. Include a recent performance reel with your application.',dance_styles:['Hip-Hop','Choreography'],city:'Tokyo',country:'Japan',location_text:'Shibuya, Tokyo',requirements:{skill_level:'Advanced',years_experience:3},compensation:{amount:650,currency:'USD',unit:'project'},application_url:'https://example.com/tokyo/auditions/camp',contact_email:'casting@example.com',deadline:date(20),event_start_date:date(30),event_end_date:date(32),status:'complete'},
    {id:102,source_link_id:1,title:'Backup dancers for a runway performance',organization:'Shibuya Stage Collective',opportunity_type:'commercial',description:'Four dancers for a runway performance. Paid rehearsal and show day. A short introduction and portfolio link are requested.',dance_styles:['Hip-Hop'],city:'Tokyo',country:'Japan',location_text:'Harajuku, Tokyo',requirements:{skill_level:'Intermediate',years_experience:2},compensation:{amount:450,currency:'USD',unit:'day'},application_url:'https://example.com/tokyo/casting/runway',deadline:date(12),event_start_date:date(24),event_end_date:date(25),status:'matched'},
    {id:103,source_link_id:2,title:'Contemporary dancer residency',organization:'Singapore Motion Lab',opportunity_type:'audition',description:'A short contemporary dance residency. Compensation has not been published; confirm terms with the organizer before applying.',dance_styles:['Contemporary'],city:'Singapore',country:'Singapore',location_text:'Singapore',requirements:{skill_level:'Advanced',years_experience:2},compensation:null,application_url:'https://example.org/sg/residency',contact_email:'studio@example.org',deadline:date(30),event_start_date:date(45),event_end_date:date(59),status:'incomplete',missing_fields:['compensation'],completeness_score:.7},
    {id:104,source_link_id:3,title:'Music video casting',organization:'Osaka Stage Company',opportunity_type:'commercial',description:'Applications for this production have closed. Saved drafts remain available for reference.',dance_styles:['Hip-Hop'],city:'Osaka',country:'Japan',location_text:'Osaka',requirements:{skill_level:'Advanced',years_experience:4},compensation:{amount:800,currency:'USD',unit:'project'},application_url:'https://example.net/osaka/casting/closed',deadline:date(-3),event_start_date:date(-2),event_end_date:date(-1),status:'expired'}
  ].map(o=>({raw_page_id:o.id+400,extraction_attempt_id:o.id+500,canonical_key:'sample-'+o.id,raw_url:o.application_url,contact_email:null,contact_phone:null,confidence:.94,completeness_score:.95,missing_fields:[],first_seen_at:iso,last_seen_at:iso,extracted_at:iso,...o}));
  const dancer={id:2394,email:'yuki@example.com',phone_number:null,city:'Tokyo',country:'Japan',dance_styles:'Hip-Hop,Choreography',preferred_types:'workshop,commercial',skill_level:'Advanced',year_experience:4,availibility:true,travelRadiusKm:25,min_compensation:300,portfolio_url:'https://example.com/yuki/reel',languages:'en,ja',isActive:true};
  const data={version:4,dancers:[dancer,{...dancer,id:2395,email:'ken@example.com',city:'Osaka'}],ai_source_links:sources,ai_opportunities:opportunities,
    ai_discovery_queries:[{id:1,keyword:'dance auditions Tokyo',country:'Japan',city:'Tokyo',language:'en',enabled:true,last_run_at:iso},{id:2,keyword:'contemporary dancer Singapore',country:'Singapore',city:'Singapore',language:'en',enabled:false,last_run_at:null}],
    ai_discovered_source_candidates:[{id:801,discovery_query_id:1,pipeline_run_id:null,provider:'search',keyword:'dance auditions Tokyo',title:'Tokyo performance opportunities',url:'https://example.net/tokyo/opportunities',normalized_url:'https://example.net/tokyo/opportunities',domain:'example.net',snippet:'Public casting page for upcoming shows.',city:'Tokyo',country:'Japan',classification:'recruitment',confidence:.83,status:'pending_review',reason:null,approved_source_link_id:null}],
    ai_pipeline_runs:[],ai_crawl_attempts:[],ai_extraction_attempts:[],ai_raw_pages:opportunities.map(o=>({id:o.raw_page_id,source_link_id:o.source_link_id,url:o.raw_url,final_url:o.raw_url,title:o.title,text:o.description,content_hash:o.canonical_key,status_code:200,scraped_at:iso})),ai_recommendations:[],
    ai_application_templates:[{id:1,code:'INTRO_EN',name:'General introduction',language:'en',enabled:true,subject_template:'Application: {{title}}',body_template:'Dear {{organization}} team,\n\nI would like to apply for {{title}}. I am a {{skill_level}} dancer based in {{city}}, with {{year_experience}} years of experience in {{dance_styles}}.\n\nPortfolio: {{portfolio_url}}\n\nThank you for considering my application.\nBest regards',required_variables:['organization','title','city','portfolio_url'],optional_variables:[],priority:3},{id:2,code:'INTRO_JA',name:'General introduction JP',language:'ja',enabled:true,subject_template:'応募：{{title}}',body_template:'{{organization}} 採用ご担当者様\n\n「{{title}}」に応募いたします。{{city}}を拠点に活動し、{{dance_styles}}の経験は{{year_experience}}年です。\n\nポートフォリオ：{{portfolio_url}}\n\nご検討のほど、よろしくお願いいたします。',required_variables:['organization','title','city','portfolio_url'],optional_variables:[],priority:3}],
    extensions:{profile:{display_name:'Yuki Tanaka',currency:'USD',compensation_unit:'project',max_duration_days:365},age:{dob:null,accepted_at:null},agentSuspensions:{},history:{104:{saved:true,drafts:{en:'Previously saved application draft.'},applied_at:null}},submissions:[{id:901,dancer_id:2395,url:'https://example.org/osaka/workshop',normalized_url:'https://example.org/osaka/workshop',note:'Workshop teaching opportunity',status:'pending_review',submitted_at:iso,reason:null}],reports:[{id:951,opportunity_id:101,dancer_id:2395,reason:'Incorrect compensation',note:'Please compare the amount with the original listing.',status:'pending',created_at:iso}],moderation:{},schedule:{enabled:false,crawl_time:'08:00',timezone:'Asia/Singapore'},push:{enabled:true},audit:[]}
  };
  if(!window.HAMMER_COMPACT_TEST)expandDemo(data,date);
  return data;
};

function expandDemo(d,date){
  const at=hours=>new Date(Date.now()-hours*3600000).toISOString();
  d.extensions.demoVersion=2;
  d.ai_source_links.push(...[
    [4,'KYOTO_RESIDENCY','https://example.org/kyoto/residency','Kyoto',true,'success'],
    [5,'OSAKA_COMMERCIAL','https://example.net/osaka/commercial','Osaka',true,'unchanged'],
    [6,'SG_COMMUNITY','https://example.com/sg/community','Singapore',false,'pending']
  ].map(([id,source_code,url,city,enabled,crawl_status])=>({id,source_code,url,normalized_url:url,city,country:city==='Singapore'?'Singapore':'Japan',enabled,crawl_status,provider:(id===4)?'admin':(id===5)?'ai_keyword':'dancer',priority:id-1,notes:'Synthetic review scenario',last_http_status:null,last_crawled_at:null,next_crawl_at:null,crawl_count:0,failed_count:0,unchanged_count:0,error_message:null})));
  const variants=[
    [105,4,'Contemporary residency - accommodation included','Kyoto Arts House','complete',1200,'USD','project',40],
    [106,5,'Commercial shoot - deadline under review','Osaka Media Lab','complete',900,'USD','day',8],
    [107,5,'Casting withdrawn after verification','Osaka Casting Office','complete',300,'USD','day',10],
    [108,4,'Festival performer - organizer unconfirmed',null,'incomplete',null,null,null,null],
    [109,4,'New teaching opportunity awaiting review','Kyoto Dance School','new',45000,'JPY','project',25],
    [110,5,'Completed spring production','Osaka Creative Studio','archived',700,'USD','project',-20],
    [111,2,'Weekend dance teaching contract','SG Movement Academy','matched',600,'SGD','day',16],
    [112,4,'Summer workshop auditions closed','Kyoto Performance Lab','expired',1800,'USD','project',-2]
  ];
  for(const [id,sourceId,title,organization,status,amount,currency,unit,deadline] of variants){const s=d.ai_source_links.find(s=>s.id===sourceId);d.ai_opportunities.push({...d.ai_opportunities[0],id,source_link_id:sourceId,title,organization,status,city:s.city,country:s.country,location_text:s.city,description:'Sample opportunity for reviewing data quality, visibility and application flows.',dance_styles:id%2?['Hip-Hop']:['Contemporary'],compensation:amount===null?null:{amount,currency,unit},deadline:deadline===null?null:date(deadline),event_start_date:date((deadline??30)+5),event_end_date:date((deadline??30)+8),application_url:s.url+'/'+id,raw_url:s.url+'/'+id,contact_email:null,raw_page_id:id+400,extraction_attempt_id:id+500,canonical_key:'sample-'+id,confidence:id===108?.48:.91,completeness_score:id===108?.5:1,missing_fields:id===108?['organization','compensation','deadline']:[]});}
  d.extensions.moderation={106:'hidden',107:'removed'};
  d.extensions.history={104:{saved:true,drafts:{en:'Previously saved application draft.'},applied_at:null},101:{saved:true,drafts:{en:'My workshop application draft.'},copied_at:at(10),applied_at:at(9)},105:{saved:false,drafts:{en:'Residency introduction draft.'},copied_at:at(8),applied_at:null},111:{saved:true,drafts:{},applied_at:at(4)}};
  d.dancers.push(...[
    [2396,'mei@example.com','Singapore','Intermediate',2,false],
    [2397,'sora@example.com','Kyoto','Advanced',9,true],
    [2398,'alex@example.com','Tokyo','Beginner',1,true],
    [2399,'mina@example.com','Osaka','Advanced',6,false]
  ].map(([id,email,city,skill_level,year_experience,availibility])=>({...d.dancers[0],id,email,city,country:city==='Singapore'?'Singapore':'Japan',skill_level,year_experience,availibility,dance_styles:id%2?'Contemporary':'Hip-Hop',portfolio_url:'https://example.com/portfolio/'+id})));
  d.extensions.agentSuspensions={2399:true};
  d.extensions.ageDeclarations={2395:{dob:'1995-04-12',accepted_at:at(80)},2396:{dob:'1999-08-17',accepted_at:at(48)},2397:{dob:'1990-02-11',accepted_at:at(24)},2399:{dob:'1998-06-03',accepted_at:at(12)}};
  d.extensions.reports.push(...[
    [952,106,2395,'Incorrect deadline','Temporarily hidden while the organizer confirms dates.','resolved','hide'],
    [953,107,2396,'Fake listing','Organizer confirmed this casting is not genuine.','resolved','remove'],
    [954,108,2397,'Missing information','No organizer name or compensation listed.','pending',null],
    [955,108,2398,'Suspicious link','Please verify the original listing.','pending',null],
    [956,105,2399,'Incorrect compensation','Checked against original source; compensation is correct.','resolved','dismiss']
  ].map(([id,opportunity_id,dancer_id,reason,note,status,resolution])=>({id,opportunity_id,dancer_id,reason,note,status,resolution,created_at:at(7),resolved_at:status==='resolved'?at(5):null,resolution_note:status==='resolved'?note:null})));
  d.extensions.submissions.push({id:902,dancer_id:2396,url:d.ai_source_links[5].url,normalized_url:d.ai_source_links[5].url,note:'Community teaching listings.',status:'approved',approved_source_link_id:6,submitted_at:at(30)},{id:903,dancer_id:2397,url:'https://example.org/unrelated',normalized_url:'https://example.org/unrelated',note:'Review this page.',status:'rejected',reason:'Not a recruitment source.',submitted_at:at(20)},{id:904,dancer_id:2398,url:d.ai_source_links[0].url,normalized_url:d.ai_source_links[0].url,note:'Existing audition source.',status:'duplicate',reason:'Already configured as source #1',submitted_at:at(10)});
  d.ai_discovery_queries.push(...[[3,'Kyoto dance residency','JP','Kyoto','en',true],[4,'Osaka commercial casting','JP','Osaka','ja',true],[5,'remote dance teaching','','','en',true],[6,'Singapore choreography','SG','Singapore','en',true]].map(([id,keyword,country,city,language,enabled])=>({id,keyword,country,city,language,enabled,last_run_at:null})));
  const candidates=[
    [802,1,'https://example.com/tokyo/studio-b','pending_review',null],
    [803,1,'https://example.net/tokyo/non-job','rejected',null],
    [804,4,d.ai_source_links[3].url,'approved',4],
    [805,4,'https://example.net/osaka/invalid','invalid',null],
    [806,6,'https://example.org/sg/casting-a','pending_review',null],
    [807,6,'https://example.org/sg/casting-b','pending_review',null],
    [808,6,'https://example.org/sg/casting-c','pending_review',null]
  ];
  for(const [id,qid,url,status,source] of candidates){const q=d.ai_discovery_queries.find(q=>q.id===qid);d.ai_discovered_source_candidates.push({id,discovery_query_id:qid,keyword:q.keyword,provider:'search',url,normalized_url:url,domain:new URL(url).hostname,title:'Sample source '+id,city:q.city,country:q.country==='SG'?'Singapore':'Japan',status,approved_source_link_id:source,reason:status==='rejected'?'Not a recruitment source.':status==='invalid'?'URL did not resolve to a usable listing.':null,created_at:at(2),updated_at:at(1)});}
  d.extensions.discoveryRuns=[
    {id:'demo-search-6',query_id:6,status:'success',links:4,new_links:3,duplicates:1,candidate_ids:[806,807,808,801]},
    {id:'demo-search-4',query_id:4,status:'success',links:2,new_links:0,duplicates:2,candidate_ids:[804,805]},
    {id:'demo-search-1',query_id:1,status:'success',links:3,new_links:3,duplicates:0,candidate_ids:[801,802,803]},
    {id:'demo-search-3',query_id:3,status:'success',links:0,new_links:0,duplicates:0,candidate_ids:[]},
    {id:'demo-search-2',query_id:2,status:'failed',links:null,new_links:null,duplicates:null,candidate_ids:[],error:'Search provider rate limit reached. Retry later.'},
    {id:'demo-search-4-original',query_id:4,status:'success',links:2,new_links:2,duplicates:0,candidate_ids:[804,805]}
  ].map((r,i)=>({...r,keyword:d.ai_discovery_queries.find(q=>q.id===r.query_id).keyword,started_at:at(i+1),error:r.error||null}));
  d.extensions.history[111].copied_at=at(5);
  for(const q of d.ai_discovery_queries)q.last_run_at=d.extensions.discoveryRuns.find(r=>r.query_id===q.id)?.started_at||null;
  for(const c of d.ai_discovered_source_candidates){const first=d.extensions.discoveryRuns.filter(r=>r.candidate_ids.includes(c.id)).at(-1);if(first){c.created_at=first.started_at;c.updated_at=c.created_at;}}
  d.extensions.runSamplesVersion=1;
  d.ai_pipeline_runs=[];d.ai_crawl_attempts=[];d.ai_raw_pages=[];d.ai_extraction_attempts=[];
  for(const s of d.ai_source_links){const jobs=d.ai_opportunities.filter(o=>o.source_link_id===s.id);s.crawl_count=0;s.failed_count=0;s.unchanged_count=0;
    if(jobs.length){const runId=7000+s.id,attemptId=7100+s.id,started=at(24+s.id);d.ai_crawl_attempts.push({id:attemptId,source_link_id:s.id,pipeline_run_id:runId,status:'success',started_at:started,finished_at:started,http_status:200});d.ai_pipeline_runs.push({id:runId,pipeline_type:'ingestion',trigger_type:'scheduled',status:'success',started_at:started,finished_at:started,total_sources:1,total_raw_pages:jobs.length,total_opportunities:jobs.length,error_message:null});s.crawl_count++;s.last_crawled_at=started;s.last_http_status=200;
      for(const o of jobs){o.extracted_at=started;o.first_seen_at=started;o.last_seen_at=started;d.ai_raw_pages.push({id:o.raw_page_id,source_link_id:s.id,crawl_attempt_id:attemptId,url:o.raw_url,final_url:o.raw_url,title:o.title,text:o.description,content_hash:o.canonical_key,status_code:200,scraped_at:started});d.ai_extraction_attempts.push({id:o.extraction_attempt_id,raw_page_id:o.raw_page_id,pipeline_run_id:runId,status:'success',started_at:started,finished_at:started,opportunities_count:1});}}
    if(['failed','unchanged','skipped'].includes(s.crawl_status)){const state=s.crawl_status,runId=7200+s.id,started=at(s.id);d.ai_crawl_attempts.push({id:7300+s.id,source_link_id:s.id,pipeline_run_id:runId,status:state,started_at:started,finished_at:started,http_status:state==='failed'?503:state==='skipped'?null:200});d.ai_pipeline_runs.push({id:runId,pipeline_type:'ingestion',trigger_type:'scheduled',status:state==='failed'?'failed':'success',started_at:started,finished_at:started,total_sources:1,total_raw_pages:0,total_opportunities:0,error_message:state==='failed'?'HTTP 503: source unavailable.':state==='skipped'?'Source disabled; skipped.':'Content unchanged.'});s.crawl_count++;s.failed_count=state==='failed'?1:0;s.unchanged_count=state==='unchanged'?1:0;s.last_crawled_at=started;s.last_http_status=state==='failed'?503:state==='skipped'?null:200;}
  }
  d.ai_pipeline_runs.sort((a,b)=>b.started_at.localeCompare(a.started_at));
  d.extensions.audit=[{at:at(5),actor:'admin',action:'Job hidden after report review',entity:106},{at:at(6),actor:'admin',action:'Job removed after verification',entity:107},{at:at(10),actor:'admin',action:'Community source approved',entity:6}];
}
