# Shared Constants

Ovaj folder sadrži univerzalne konstante koje se koriste u web i mobilnoj aplikaciji.

## Struktura

- `constants/bikeTypes.js` - Tipovi bicikala (Gradski, Planinski, BMX, Električni, Hibridni, Cargo)
- `constants/bikeStatus.js` - Statusi bicikala (Dostupan, U upotrebi, Servis, Neaktivan)
- `constants/index.js` - Centralni export za sve konstante

## Korišćenje

### Web aplikacija

```javascript
import { getBikeType, DEFAULT_BIKE_TYPE } from "../../../shared/constants/bikeTypes.js";
import { getBikeStatus } from "../../../shared/constants/bikeStatus.js";
```

### Mobilna aplikacija (React Native)

```javascript
import { getBikeType, DEFAULT_BIKE_TYPE } from "../../shared/constants/bikeTypes";
import { getBikeStatus } from "../../shared/constants/bikeStatus";
```

## Funkcije

### Bike Types

- `getBikeType(type)` - Vraća kompletan objekat tipa bicikla
- `getBikeTypeLabel(type)` - Vraća samo label tipa
- `getBikeTypeOptions()` - Vraća listu svih tipova kao array
- `DEFAULT_BIKE_TYPE` - Default tip ("gradski")

### Bike Status

- `getBikeStatus(status)` - Vraća kompletan objekat statusa
- `getBikeStatusLabel(status)` - Vraća label statusa
- `getBikeStatusLabelShort(status)` - Vraća kratki label
- `getBikeStatusOptions()` - Vraća listu svih statusa kao array
- `DEFAULT_BIKE_STATUS` - Default status ("available")
