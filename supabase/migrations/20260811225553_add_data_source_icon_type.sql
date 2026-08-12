alter table app.data_sources
    add column icon_type text
    check (icon_type in ('Emoji', 'Image', 'Native'));
