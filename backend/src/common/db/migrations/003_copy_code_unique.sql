update copies
set barcode = concat('CPY-', upper(substr(replace(id::text, '-', ''), 1, 6)))
where barcode is null or trim(barcode) = '';

create unique index if not exists copies_barcode_unique_idx
on copies (upper(barcode));
