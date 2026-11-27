-- Independent fields: price column stores scaled numeric reference values.
INSERT INTO ecovit_price_references(key,item,price) VALUES
('grout:verticalConsumption','{"group":"grout","key":"verticalConsumption"}',4220),
('grout:verticalLoss','{"group":"grout","key":"verticalLoss"}',500),
('grout:horizontalConsumption','{"group":"grout","key":"horizontalConsumption"}',2560),
('grout:horizontalLoss','{"group":"grout","key":"horizontalLoss"}',1000)
ON CONFLICT(key) DO NOTHING;
