# UAOS PA3X Format Group Report 005

Files parsed: 39
Fixture unchanged against Run 003 hashes: YES

## Extension Summary
- .mxp: 1 files, 1943 bytes, roles {"global-mixer-preset-related":1}
- .gbl: 1 files, 3381 bytes, roles {"global-related":1}
- .voc: 1 files, 34304 bytes, roles {"vocal-preset-related":1}
- .pad: 10 files, 50688 bytes, roles {"pad-related":10}
- .prf: 16 files, 428743 bytes, roles {"performance-related":16}
- .sbl: 1 files, 2915 bytes, roles {"songbook-list-related":1}
- .sbd: 7 files, 289936 bytes, roles {"songbook-related":7}
- .sty: 1 files, 767611 bytes, roles {"style-related":1}
- .md: 1 files, 507 bytes, roles {"metadata-report":1}

## Header Groups
- .mxp|global-mixer-preset-related|KORF|small: 1 files, size 1943-1943 bytes, folders GLOBAL
- .gbl|global-related|KORF|small: 1 files, size 3381-3381 bytes, folders GLOBAL
- .voc|vocal-preset-related|KORF|medium: 1 files, size 34304-34304 bytes, folders GLOBAL
- .pad|pad-related|KORF|medium: 3 files, size 4547-17435 bytes, folders PAD
- .pad|pad-related|KORF|small: 6 files, size 529-3648 bytes, folders PAD
- .pad|pad-related|KORF+RIFF|small: 1 files, size 3302-3302 bytes, folders PAD
- .prf|performance-related|KORF|medium: 16 files, size 21975-32230 bytes, folders PERFORM
- .sbl|songbook-list-related|KORF|small: 1 files, size 2915-2915 bytes, folders SONGBOOK
- .sbd|songbook-related|KORF|medium: 6 files, size 46514-51534 bytes, folders SONGBOOK
- .sbd|songbook-related|KORF|small: 1 files, size 2557-2557 bytes, folders SONGBOOK
- .sty|style-related|KORF|large: 1 files, size 767611-767611 bytes, folders STYLE
- .md|metadata-report|no-magic|small: 1 files, size 507-507 bytes, folders OTHER

## Notes
- KORF appears as a repeated magic pattern in PA3X-related binary headers.
- This report does not decode musical events, samples, or proprietary payloads.
