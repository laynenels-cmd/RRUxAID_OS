insert into public.profiles (id, email, full_name, role)
select id, email, coalesce(raw_user_meta_data->>'full_name', email), 'admin'
from auth.users
where email = 'admin@rru-aid.internal'
on conflict (id) do update set role = 'admin', email = excluded.email, updated_at = timezone('utc', now());

insert into public.athletes (
  id, code, name, sport, level, audience_count, audience_label, platforms, source, owner, stage, stage_index,
  readiness_score, brand_summary, monetization_summary, audience_behavior, trust_signals, inbound_questions,
  assets, current_leak, next_action, pipeline_value, avatar_initials
) values
('00000000-0000-4000-8000-000000000042','NR-042','Nico Ramirez','Combat Sports','Professional',112000,'112K',array['IG','YT','X'],'RRU - Tyler Direct','AID','Buildout Proposal',4,81,'Disciplined professional fighter. Storyteller of the grind. Resonates with high-performing men 28-45.','Single sponsor deal at $4K per quarter. No owned audience. No CTA path.','70% male, US/MX/CA. Engages with structure, conditioning, and mindset content.',array['7-year pro record','12 main-card features','Featured in 3 documentaries'],array['What is your training split?','Coaching available?','What do you eat?'],array['IG 112K','YT 38K','X 14K','Email list: 1,800'],'Strong identity, no first-offer path. Inbound DMs going unmonetized.','Approve buildout proposal - $18,500 scope',18500,'NR'),
('00000000-0000-4000-8000-000000000029','MK-029','Marcus King','Baseball','MLB',84000,'84K',array['IG','X','TikTok'],'RRU - Road Haus','AID','First Offer Design',3,74,'Veteran utility infielder. Family man. Faith-forward. Hitting-IQ educator.','Two endorsements at $60K per year combined. No DTC product. No list.','55% male 30-50, parent demographic, baseball families.',array['9 MLB seasons','Hitting clinic alumni 240+','Father-coach community'],array['Do you do clinics?','Can my son train with you?','Hitting drill recommendations?'],array['IG 84K','X 22K','TikTok 11K','Coaching alumni list'],'Strong inbound from kids and parents. No youth product. Sponsorships static.','Finalize first-offer mechanic - youth hitting cohort',14200,'MK'),
('00000000-0000-4000-8000-000000000017','DP-017','Devon Price','Retired Athlete','Founder',26000,'26K',array['LinkedIn','X','Substack'],'RRU - Founder Network','RRU','Funnel Build',4,67,'Ex-pro turned founder. Operator voice. Wealth and business literacy for athletes.','Speaking at $8K per event. One-to-one advisory is ad hoc. No productized offer.','Investors, athletes, operators, and founders. High-comment threads around ownership and access.',array['Founder network','Private investor rooms','Speaking proof'],array['Can you advise our group?','Do you invest with athletes?','How do players avoid bad deals?'],array['LinkedIn 19K','X 7K','Substack 3K'],'Advisory demand exists, but there is no discovery-call funnel.','Deploy lead-magnet to discovery-call funnel',12000,'DP'),
('00000000-0000-4000-8000-000000000061','JT-061','Jalen Torres','Football','NCAA D1',42000,'42K',array['IG','TikTok'],'RRU - Combine Network','AID','Complete Diagnostic',2,58,'Starting LB. Energy, work ethic, region-loyal Texas audience. Recruiter-magnet content.','Three NIL deals at $22K total to date. Local restaurant partnership.','Parents, high school athletes, and regional fans. Strong saves on training content.',array['D1 starter','Regional recruiting pull','Combine network'],array['How do I get recruited?','What camps matter?','Can you review film?'],array['IG 31K','TikTok 11K'],'Zero owned audience capture and no defined commercial offer.','Complete diagnostic - schedule discovery call',6800,'JT'),
('00000000-0000-4000-8000-000000000083','IB-083','Isaiah Brooks','Basketball','Overseas Pro',61000,'61K',array['IG','YT','TikTok'],'RRU - Premium Rooms','AID','Sponsorship Path Map',3,63,'International hooper. Travel-storyteller. Aspirational, polished, business-minded.','Sponsors at $45K per year. No direct-to-consumer offer. No list capture.','Travel-engaged basketball audience with strong replies around overseas path questions.',array['Overseas pro','Travel content proof','Sponsor history'],array['How do you play overseas?','What agents are real?','How much can players make?'],array['IG 45K','YT 9K','TikTok 7K'],'Sponsor rate is not structured and no information product exists.','Map sponsorship architecture and rate card',9400,'IB'),
('00000000-0000-4000-8000-000000000094','AC-094','Adrian Cole','Baseball','MiLB AA',18000,'18K',array['IG'],'RRU - Agency Intro','AID','Audience Capture',1,49,'Hard-working AA pitcher. Faith and family. Process over hype.','None. No deals. No product.','Small but loyal audience around recovery, faith, and family.',array['AA pitcher','Agency intro','Faith-first community'],array['What is your recovery routine?','How do you stay consistent?','Do you mentor?'],array['IG 18K'],'No audience capture and no defined identity for monetization.','Audience capture mechanic and identity narrative',3500,'AC')
on conflict (id) do update set
  readiness_score = excluded.readiness_score,
  stage = excluded.stage,
  updated_at = timezone('utc', now());

insert into public.athlete_leaks (athlete_id, label, severity) values
('00000000-0000-4000-8000-000000000042','No first transaction path','high'),
('00000000-0000-4000-8000-000000000042','Email list growing 4% with no capture mechanism','high'),
('00000000-0000-4000-8000-000000000029','Youth demand uncaptured','high'),
('00000000-0000-4000-8000-000000000017','No discovery-call funnel','high'),
('00000000-0000-4000-8000-000000000061','Zero owned audience capture','high'),
('00000000-0000-4000-8000-000000000083','Sponsor rate not structured','high'),
('00000000-0000-4000-8000-000000000094','No defined identity for monetization','high');

insert into public.athlete_opportunities (athlete_id, label) values
('00000000-0000-4000-8000-000000000042','21-Day Performance Reset'),
('00000000-0000-4000-8000-000000000042','Recurring Performance Community'),
('00000000-0000-4000-8000-000000000029','Youth Hitting Cohort'),
('00000000-0000-4000-8000-000000000017','Advisory Cohort'),
('00000000-0000-4000-8000-000000000061','Recruiting-Path Cohort'),
('00000000-0000-4000-8000-000000000083','Sponsorship Tier Architecture'),
('00000000-0000-4000-8000-000000000094','Audience Capture Lead Magnet');

insert into public.offers (id, athlete_id, name, price, buyer_profile, promise, mechanism, deliverables, projected_month_1_revenue, status)
values
('20000000-0000-4000-8000-000000000042','00000000-0000-4000-8000-000000000042','Fight Shape Reset',297,'High-performing men 28-45 who want fighter-level structure.','A 21-day fighter-inspired reset that restores consistency.','Daily protocol, weekly check-in, and demonstration assets.','{"items":["21-day training protocol","Nutrition rhythm guide","Weekly check-in form"],"risk_reversal":"Refund if seven days are completed without a usable rhythm.","proof_assets_needed":["Nico training reel","Buyer screenshots"]}',47000,'approved'),
('20000000-0000-4000-8000-000000000029','00000000-0000-4000-8000-000000000029','Hitting IQ - Father/Son Cohort',497,'Baseball parents with sons age 10-16.','A four-week cohort for smarter hitting practice.','Weekly live teaching, drill library, and final swing review.','{"items":["4 cohort calls","Hitting IQ workbook","Swing review template"],"risk_reversal":"First-call satisfaction guarantee.","proof_assets_needed":["Clinic clips","Parent quotes"]}',38000,'review')
on conflict (id) do nothing;

insert into public.buildouts (id, athlete_id, stage, percent_complete, owner, blocker, risk_level, next_action, status)
values
('10000000-0000-4000-8000-000000000042','00000000-0000-4000-8000-000000000042',4,62,'AID',null,'high','Approve scope and deploy CTA path','active'),
('10000000-0000-4000-8000-000000000029','00000000-0000-4000-8000-000000000029',3,38,'AID','Pricing review pending operator sign-off','high','Lock cohort cap and price','blocked'),
('10000000-0000-4000-8000-000000000017','00000000-0000-4000-8000-000000000017',4,71,'RRU','Email warm-up stalled day 4','medium','Finish discovery-call page QA','active'),
('10000000-0000-4000-8000-000000000061','00000000-0000-4000-8000-000000000061',2,24,'AID','CTA path undeployed','high','Complete diagnostic and capture mechanic','active'),
('10000000-0000-4000-8000-000000000083','00000000-0000-4000-8000-000000000083',3,41,'AID',null,'medium','Build sponsor tier map','active'),
('10000000-0000-4000-8000-000000000094','00000000-0000-4000-8000-000000000094',1,12,'AID',null,'medium','Define identity and lead magnet','not_started')
on conflict (id) do nothing;

insert into public.buildout_tasks (buildout_id, title, description, status, due_date) values
('10000000-0000-4000-8000-000000000042','Approve buildout scope','Confirm price, deliverables, and launch window with Tyler.','doing','2026-06-03'),
('10000000-0000-4000-8000-000000000042','Draft launch CTA','Create CTA and payment path copy for Fight Shape Reset.','todo','2026-06-05'),
('10000000-0000-4000-8000-000000000029','Finalize cohort price','Set cap, price, and call cadence.','blocked','2026-06-04');

insert into public.pipeline_deals (id, athlete_id, deal_name, deal_type, amount, probability, stage, expected_close_date)
values
('30000000-0000-4000-8000-000000000042','00000000-0000-4000-8000-000000000042','Nico Ramirez Buildout Scope','Infrastructure Buildout',18500,82,'Buildout Proposed','2026-06-07'),
('30000000-0000-4000-8000-000000000029','00000000-0000-4000-8000-000000000029','Marcus King First Offer Buildout','Infrastructure Buildout',14200,68,'Diagnostic Sold','2026-06-12'),
('30000000-0000-4000-8000-000000000017','00000000-0000-4000-8000-000000000017','Devon Price Funnel Completion','Ongoing Optimization',12000,74,'Active Fulfillment','2026-06-04'),
('30000000-0000-4000-8000-000000000061','00000000-0000-4000-8000-000000000061','Jalen Torres Diagnostic','Revenue Diagnostic',6800,46,'Qualified','2026-06-18'),
('30000000-0000-4000-8000-000000000083','00000000-0000-4000-8000-000000000083','Isaiah Brooks Sponsorship Map','Strategic Map',9400,58,'Buildout Proposed','2026-06-21')
on conflict (id) do nothing;

insert into public.reports (id, athlete_id, report_type, title, status, content)
values
('40000000-0000-4000-8000-000000000042','00000000-0000-4000-8000-000000000042','Athlete Revenue Infrastructure Audit','Nico Ramirez Revenue Infrastructure Audit','approved','{"summary":"Nico has the strongest near-term buildout case in the pilot cohort.","sections":[{"title":"Primary Revenue Leak","body":"Inbound DMs and list growth are not connected to a first paid offer.","bullets":["No visible CTA path","Email list is not used for launch warm-up"]},{"title":"Recommended Path","body":"Approve Fight Shape Reset, deploy capture, and launch to the warm audience."}],"metrics":{"readiness_score":81,"projected_month_1_revenue":47000,"pipeline_value":18500}}')
on conflict (id) do nothing;
