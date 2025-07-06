Namucio me je malo prvi deo projekta, dok sam napravio Puppeteer da radi, iz razloga sto Stake.com ima Cloudflare zastitu, pa mi je trebalo malo vremena da pronadjem i predjem na Puppeteer-extra i Stealth plugin, pa posle za isto, konfiguracija za Dockerfile.

Takodje Docker nisam uspevao da pokrenem, pa sam posle izvesnog vremena zakljucio da mi nije upaljena u BIOS-u neka virtuelizacija na procesoru.

Uspeo sam sve da zavrsim i napravim da radi, osim provere za vebsajt https://bc.game/

Naime pronasao sam javni API koji bi mogao da se koristi za proveru ali zahtev za info o korisniku izgelda ovako: https://bc.game/api/game/support/user/info/6055984/
API radi samo sa internim ID-jevima korisnika, a ne sa korisnickim imenima.
Potrazio sam neki poziv koji bi mi dao ID za dati username ali bezuspesno.
Takodje ako se radi o scrapingu sa front-end-a url za korisnikov profil izgleda ovako https://bc.game/user/profile/6055984, opet je u pitanju ID, a ne korisnicko ime.

Jedino resenje koje mi je padalo na pamet je da cekam da se korinik pojavi na "Latest Bet" kartici koja se poprilicno brzo osvezava, pa da klikom na korisnicko ime otvorim modalni prozor o inforamcijama o korisniku i tu pokupim wager amount.
Nisam ovo implementirao jer mi deluje prekomplikovano i za veci broj korisnika bi trajalo jako dugo.

Napravio sam mali API sa pozivima od kojih su neki za testiranje a neki su deo zadatka, takodje i jednu funkciju koja olaksava testiranje jednog od izvestaja.
Sve dostupne rute mozes videti GET pozivom na "/", gde su opisane njihova svrha i nacin koriscenja.

.env file

# App

PORT=3010

# PostgreSQL connection

PGHOST=postgres
PGPORT=5433
PGUSER=dev_junior
PGPASSWORD=mebit
PGDATABASE=starter
