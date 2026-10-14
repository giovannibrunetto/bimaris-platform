insert into public.territories (slug,name,description) values
('messina-stretto','Messina e Stretto','La città, il mare e il paesaggio tra due sponde.'),
('milazzo-tirrenica','Milazzo e Tirrenica','Costa, borghi e produzioni della fascia tirrenica.'),
('nebrodi','Nebrodi','Natura, trekking, allevamenti e sapori dell’entroterra.'),
('isole-eolie','Isole Eolie','Arcipelago, mare, vulcani e cultura insulare.')
on conflict (slug) do nothing;

insert into public.categories (slug,name) values
('mangiare','Mangiare'),('esperienze','Esperienze'),('mare','Mare'),('natura','Natura'),('cultura','Cultura'),('shopping-artigianato','Shopping e artigianato'),('famiglia','Famiglia')
on conflict (slug) do nothing;

insert into public.operators (slug,name,description,territory_id,selection_status,published,why_selected)
select 'operatore-demo-stretto','Operatore Demo Stretto','Operatore dimostrativo per il primo MVP.',id,'selected',true,'Rappresenta un’esperienza identitaria legata allo Stretto.' from public.territories where slug='messina-stretto'
on conflict (slug) do nothing;

insert into public.experiences (operator_id,territory_id,category_id,slug,name,excerpt,description,duration_minutes,price_from,featured,published)
select o.id,t.id,c.id,'stretto-dal-mare','Lo Stretto dal mare','Vivi Messina dalla prospettiva che la rende unica: il suo mare.','Esperienza dimostrativa sullo Stretto.',120,45,true,true
from public.operators o, public.territories t, public.categories c
where o.slug='operatore-demo-stretto' and t.slug='messina-stretto' and c.slug='mare'
on conflict (slug) do nothing;
