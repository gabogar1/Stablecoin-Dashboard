WITH current_cap as (
    WITH temp as ( 
        select *, 
        RANK() OVER (partition by coin_id ORDER BY timestamp_utc) as rank 
        from stablecoin_market_caps 
        where (select date_trunc('day',max(timestamp_utc)) from stablecoin_market_caps)  = timestamp_utc::date
    ) 
    select sum(volume_24h_usd) as current_total
    from temp 
    where rank = 1
),
previous_cap as (
    WITH temp as ( 
        select *, 
        RANK() OVER (partition by coin_id ORDER BY timestamp_utc) as rank 
        from stablecoin_market_caps 
        where (select date_trunc('day',max(timestamp_utc)) from stablecoin_market_caps) - interval '1 month'  = timestamp_utc::date
    ) 
    select sum(volume_24h_usd) as previous_total
    from temp 
    where rank = 1
)
select 
    current_total,
    previous_total,
    ((current_total - previous_total) / previous_total * 100) as percentage_change
from current_cap, previous_cap;