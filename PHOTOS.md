# Photography

The site uses the studio's own photos. Right now they hotlink the studio's
public Squarespace CDN (fine for the demo/pitch). For the production hand-off,
download the originals — or better shots curated from Instagram @danceaedc
with the studio's blessing — and drop them in `public/images/photos/` using
these exact filenames. A local file automatically wins over the remote URL
(checked once at boot; redeploy after adding files).

| File | Used for |
| --- | --- |
| `company.jpg` | Homepage hero, Company page |
| `ballet.jpg` | Ballet class cards, gallery |
| `nutcracker.jpg` | Nutcracker page hero |
| `nutcracker2.jpg` | News card |
| `acro.jpg` | Acro class cards, gallery |
| `acro2.jpg` | (spare — teen acro) |
| `preschool.jpg` | Combo/Creative Movement cards, gallery |
| `contemporary.jpg` | Contemporary class cards |
| `contemporary2.jpg` | Gallery |
| `jazz.jpg` | Jazz class cards |
| `recital.jpg` | About hero, news card |
| `candid.jpg` | Tap/Hip Hop cards, news card |
| `wewantyou.jpg` | Careers page hero |

Recommended: JPG, ~1600px on the long edge, under 400KB each.
The mapping lives in `src/data/photos.js` (add keys there to add slots).
