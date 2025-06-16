WITH temp as (
    select *,
    RANK() OVER (partition by coin_id ORDER BY timestamp_utc) as rank
    from stablecoin_market_caps 
    where (select date_trunc('day',max(timestamp_utc)) from stablecoin_market_caps)  = timestamp_utc::date
)
select sum(volume_24h_usd) as total_current_volume
from temp 
where rank = 1;