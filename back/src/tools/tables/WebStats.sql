CREATE TABLE IF NOT EXISTS `WebStats` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `clientTimestampUnix` int(11) unsigned NOT NULL,
    `app` varchar(100) NOT NULL,
    `path` varchar(500) NOT NULL,
    `action` varchar(100) NOT NULL,
    `clientId` varchar(100) NOT NULL,
    `createdAtUnix` int(11) unsigned NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
