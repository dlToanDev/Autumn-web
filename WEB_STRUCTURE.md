# Web Structure

Tai lieu nay mo ta cau truc frontend `rental-web`, vai tro tung folder va luong hoat dong chinh cua ung dung React/Vite.

## Mo Hinh Tong Quan

Frontend dang theo mo hinh React + Vite + TypeScript:

`Route -> Page -> Component -> API client -> Backend`

Nguyen tac chinh:

- `pages` la man hinh theo route.
- `components` la UI dung lai hoac layout dung chung.
- `api` la lop goi backend, khong goi `axios` truc tiep trong page neu co the.
- `types` la hop dong TypeScript dung chung giua page/component/api.
- `store` chua state global nho nhu auth.
- `utils/lib` chua helper format, file, payment, className.

## Cau Truc Folder

```text
rental-web/
├── public/
├── src/
│   ├── api/
│   ├── components/
│   │   ├── layout/
│   │   ├── payments/
│   │   └── ui/
│   ├── lib/
│   ├── pages/
│   │   ├── admin/
│   │   └── landlord/
│   ├── store/
│   ├── styles/
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── vite.config.js
├── tsconfig.json
└── eslint.config.js
```

## src/main.tsx

Diem khoi dong app:

- Tao React root.
- Boc `QueryClientProvider`.
- Boc `BrowserRouter`.
- Cau hinh `react-hot-toast`.
- Import style chinh:
  - `src/index.css`
  - `src/styles/App.css`

## src/App.tsx

Khai bao route:

- Route public: trang chu, tim phong, chi tiet phong, login/register.
- Route user: profile, payment, contract, notifications, messages.
- Route landlord: dashboard, nha/co so, phong, booking, nguoi thue, hop dong, thanh toan.
- Route admin: dashboard, users, landlords, rooms, contracts, payments, announcements, configs.

Quy uoc:

- Route can dang nhap boc bang `RequireAuth`.
- Route can role boc bang `RequireRole`.
- Page nen lazy load de build chia chunk.

## src/api

Folder `api` la lop giao tiep backend:

- `client.ts`: axios instance, base URL, token interceptor, xu ly loi chung.
- `authApi.ts`: login/register/me/profile.
- `rentalApi.ts`: phong, nha/co so, tien ich.
- `bookingApi.ts`: booking/request thue.
- `contractApi.ts`: hop dong.
- `paymentApi.ts`: payment, VietQR, SePay status.
- `messageApi.ts`: hoi thoai, lien he, tin nhan.
- `notificationApi.ts`: thong bao.
- `adminApi.ts`: API admin.
- `addressApi.ts`: tinh/huyen/xa tu backend local JSON.
- `systemConfigApi.ts`: cau hinh he thong.
- `landlordApplicationApi.ts`, `landlordTenantsApi.ts`: nghiep vu chu tro.

Quy uoc:

- Page/component khong nen goi `apiClient` truc tiep.
- Moi API function nen khai bao type return ro rang.
- Neu backend response khac UI type, map lai tai file API.

## src/components

Component dung chung:

- `components/layout`: layout he thong.
  - `PublicLayout`: header/footer/nut tin nhan cho trang public/user.
  - `ManagementLayout`: layout admin/chu tro.
  - `ManagementSidebar`: menu admin/chu tro.
  - `Header`: navbar public/user.
  - `FloatingMessageButton`: nut mo tin nhan nhanh.
- `components/ui`: UI primitives.
  - `Button`, `Input`, `Select`, `Textarea`, `Modal`, `Table`, `Card`, `Badge`, `Avatar`, `Tabs`, `Pagination`, `Skeleton`, `StatCard`.
- `components/payments`: UI rieng cho bang/lich su thanh toan.
- Component domain cap cao:
  - `PaymentQrModal`
  - `ContractDetailModal`
  - `DashboardHeroBanner`

Quy uoc:

- UI primitive khong nen chua business logic.
- Component domain co the nhan callback va data tu page.
- Component phai responsive, tranh fixed width/height neu text co the dai.

## src/pages

Page public/user:

- `HomePage`
- `RoomSearchPage`
- `RoomDetailPage`
- `LoginPage`, `RegisterPage`, `ForgotPasswordPage`, `ResetPasswordPage`
- `ProfilePage`
- `UserHomePage`
- `UserPaymentsPage`
- `UserContractsPage`
- `NotificationsPage`, `NotificationDetailPage`
- `MessagesPage`
- `BecomeLandlordPage`
- `PaymentAccountSettingsPage`

Page admin:

- `pages/admin/AdminDashboardPage`
- `AdminUsersPage`
- `AdminLandlordsPage`
- `AdminRoomsPage`
- `AdminLandlordApplicationsPage`
- `AdminContractsPage`
- `AdminPaymentsPage`
- `AdminCommissionPaymentsPage`
- `AdminAnnouncementsPage`
- `AdminPaymentSettingsPage`

Page landlord:

- `pages/landlord/LandlordDashboardPage`
- `LandlordPropertiesPage`
- `LandlordRoomsPage`
- `LandlordBookingsPage`
- `LandlordTenantsPage`
- `LandlordContractsPage`
- `LandlordPaymentsPage`
- `LandlordCommissionPaymentsPage`

Quy uoc:

- Page chi nen dieu phoi data/query/mutation va lap UI.
- Logic format dung chung dua vao `utils` hoac `lib`.
- Logic API dua vao `api`.
- Page admin/landlord phai dung `ManagementLayout`.
- Page public/user phai dung `PublicLayout` neu can header/footer.

## src/store

`authStore.ts`:

- Luu token, user, trang thai login.
- Cung cap helper role/default route.
- Persist auth vao local storage.

Quy uoc:

- Chi dua state global that su can chia se vao store.
- State rieng cua form/modal/table nen de trong page/component.

## src/types

`types/index.ts` chua type dung chung:

- Auth/User
- Address
- Rental/Room/Property/Amenity
- Booking
- Contract
- Payment
- Notification
- Message
- LandlordApplication
- Admin/System config

Quy uoc:

- Khi backend them field response, cap nhat type tuong ung.
- Tranh dung `any` neu co the mo ta type.

## src/utils va src/lib

`lib/utils.ts`:

- `cn`
- format date, datetime, currency
- helper UI chung

`utils`:

- `file.ts`: doc file/base64.
- `paymentPresentation.ts`: label/status payment.
- `rentBilling.ts`: tinh ky tien thue.

Quy uoc:

- Helper pure function nen de o day.
- Khong goi API trong `utils`.

## src/styles

Style dang duoc import that:

- `src/index.css`: Tailwind import, design token, base style, utilities.
- `src/styles/App.css`: tap hop CSS bo sung theo page/component.

Quy uoc:

- Uu tien Tailwind class trong component/page moi.
- Chi them CSS rieng khi class qua dai, style dung lai, hoac can override legacy.
- File CSS cu da duoc doi ten tu `styles_legacy` thanh `styles` vi van dang duoc app import.
- Cac file backup `.bak` cu da bi xoa khoi web de source gon hon.

## Luong Hoat Dong Chinh

Dang nhap:

`LoginPage -> authApi.login -> authStore.setAuth -> navigate default route`

Tim phong:

`RoomSearchPage -> rentalApi.getRooms -> RoomCard -> RoomDetailPage`

Dat/thue phong:

`RoomDetailPage -> bookingApi -> paymentApi/PaymentQrModal -> Notifications`

Quan ly chu tro:

`Landlord*Page -> landlord/rental/payment/contract APIs -> ManagementLayout`

Quan ly admin:

`Admin*Page -> adminApi/paymentApi/systemConfigApi -> ManagementLayout`

Nhan tin:

`MessagesPage -> messageApi.getConversations/getContacts/getMessagesWithUser/sendMessage`

Thanh toan:

`UserPaymentsPage/LandlordPaymentsPage/AdminPaymentsPage -> paymentApi -> PaymentQrModal`

## Quy Uoc Khi Them Chuc Nang Moi

1. Them type vao `src/types/index.ts`.
2. Them API function vao `src/api/<domain>Api.ts`.
3. Them page vao `src/pages` hoac `src/pages/admin|landlord`.
4. Them route trong `src/App.tsx`.
5. Tach UI lap lai vao `src/components`.
6. Dung `useQuery/useMutation` cho API state.
7. Dam bao responsive:
   - container co `min-w-0` khi nam trong flex/grid.
   - bang du lieu dung `Table` de co horizontal scroll.
   - button/link khong ep height neu label co the dai.
   - text dai dung `truncate`, `line-clamp`, `break-words` tuy truong hop.
8. Chay kiem tra:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Luu Y Trien Khai

- Build output nam o `dist/`.
- Vite dev server mac dinh chay `npm run dev`.
- Backend URL lay tu cau hinh axios/client; khi deploy server can kiem tra bien moi truong/base URL.
- Khong hardcode secret/token vao frontend.
