
# bugs need to be fix UI/UX

1. in the admin routs when we add CSV or just one personnal to the authorized_personnel we can't use - or ' for names
wqe need to support this chars
2. make sure we can handle multiple possibility to insert phone numbers
ignore not digits charas and multiple -  or spaces
3. in the admin panel we need the ability to update some fields in the authorized_personnel.
4. need to add IsRegisterd field to authorized_personnel.
5. After successfully adding authorized_personnel in the admin panel, the UI shows a misleading cache message ("הנתונים נטענו מהמטמון המקומי") instead of the success message.
   - **Root cause:** `usePersonnelManagement.ts:100` calls `fetchPersonnel()` without `forceRefresh=true` after a successful add. Since cached data exists from the initial page load, `fetchPersonnel()` returns cached data and overwrites the success message with the cache info message.
   - **Fix:** Change `await fetchPersonnel()` to `await fetchPersonnel(true)` on line 100 (and similarly on lines for update/delete/bulk-add). This ensures fresh data is fetched from Firestore after mutations.
