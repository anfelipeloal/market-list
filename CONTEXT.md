# Market List

A shared grocery tracker for a single Household: members note what has run out so it gets bought on the next shopping trip.

The app speaks Spanish. Each term lists the Spanish label the UI must use for it.

## Language

### Catalog

**Category**:
A flat, named grouping of Products, such as Fruits or Frozen Food. Categories do not nest, and their names are unique within the Household.
_UI_: Categoría
_Avoid_: Section, aisle, subcategory

**Product**:
Something the Household buys, identified by its name only. Belongs to exactly one Category, and its name is unique across all Categories.
_UI_: Producto
_Avoid_: Item, article

**Pantry**:
The Products the Household is not currently short of.
_UI_: Despensa
_Avoid_: Available, stock, inventory

**Shopping List**:
The Products the Household needs to buy on the next shopping trip. A Product is either in the Pantry or on the Shopping List, never both.
_UI_: Lista de compras
_Avoid_: To buy, market list, cart

**In Cart**:
A Product on the Shopping List that has been checked off during a shopping trip but not yet returned to the Pantry.
_UI_: En el carrito
_Avoid_: Bought, done, purchased

### Shopping trip

**Finish Trip**:
Returning every In Cart Product to the Pantry, leaving Products that were not found on the Shopping List.
_UI_: Terminar compra
_Avoid_: Checkout, complete, clear

**Reset**:
Returning every Product on the Shopping List to the Pantry at once, whether In Cart or not. Never deletes Products or Categories.
_UI_: Reiniciar lista
_Avoid_: Clear, empty, delete list

### Access

**Household**:
The single group of Users sharing one Pantry and one Shopping List.
_Avoid_: Account, team, family, tenant

**User**:
A named member of the Household who can use the app. Names are unique within the Household.
_UI_: Usuario
_Avoid_: Member, account, profile

**Admin**:
A User who can also manage Users, change PINs, Reset, and delete Products and Categories. A Household always has at least one Admin.
_UI_: Administrador
_Avoid_: Owner, superuser, moderator

**PIN**:
A 4-digit code that on its own identifies a User. Unique within the Household.
_UI_: PIN
_Avoid_: Password, passcode

**Change PIN**:
Replacing a User's PIN with a new one.
_UI_: Cambiar PIN
_Avoid_: Reset PIN, recover PIN
