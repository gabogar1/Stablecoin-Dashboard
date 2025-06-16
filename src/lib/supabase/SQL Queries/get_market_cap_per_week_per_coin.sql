

WITH temp as (
    select *
    from stablecoin_market_caps 
    where timestamp_utc < (select date_trunc('day',max(timestamp_utc)) from stablecoin_market_caps)  
    order by timestamp_utc desc
)
select
 coin_name,
 coin_id,
 date_trunc('week', timestamp_utc) as week,
 sum(market_cap_usd) as market_cap
from temp 
WHERE timestamp_utc = (
    SELECT max(timestamp_utc) 
    FROM temp m2 
    WHERE m2.coin_id = temp.coin_id 
    AND date_trunc('week', m2.timestamp_utc) = date_trunc('week', temp.timestamp_utc)
)
group by 1,2,3
order by 3 desc;