CREATE TABLE IF NOT EXISTS `Chord` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `artist` varchar(400) NOT NULL,
    `title` varchar(400) NOT NULL,
    `url` varchar(400) NOT NULL,
    `tags` varchar(400) NOT NULL,
    `creationDateUnix` int(11) unsigned NOT NULL,
    `visitsCount` int(11) NOT NULL DEFAULT 0,
    `lastAccessDateUnix` int(11) unsigned DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `url_uniq` (`url`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
