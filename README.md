# Kerjain-Yuk To Do List

Website to-do list sederhana dengan HTML, CSS, JavaScript, Firebase Authentication, dan Firebase Realtime Database.

## Yang sudah dirapikan
- Semua merge conflict Git sudah dibersihkan.
- Login dan register lebih stabil untuk GitHub Pages.
- URL verifikasi email otomatis mengikuti lokasi website.
- Jika email belum diverifikasi, sistem akan mencoba kirim ulang link verifikasi otomatis.
- Pesan error login/register lebih jelas.
- Data tugas dipisah per user, jadi akun A tidak melihat tugas akun B.
- Input tugas di-render lebih aman untuk mengurangi risiko script injection.
- Form login/register mendukung submit dengan tombol Enter.

## Konfigurasi Firebase yang dipakai di source code ini
Project Firebase yang dipakai sekarang:
- `kerjainyuk-6f4d2`

Sebelum deploy, cek ini di Firebase Console:

### 1) Authentication > Sign-in method
Aktifkan:
- **Email/Password**

### 2) Authentication > Settings > Authorized domains
Tambahkan domain deploy kamu, misalnya:
- `diyahkarmila.github.io`

### 3) Realtime Database Rules
Karena data tugas disimpan per user, rules yang aman sebaiknya seperti ini:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid"
      }
    }
  }
}
```

## Struktur data database
```text
users/
  {uid}/
    tasks/
      {taskId}
```

## Cara deploy ke GitHub Pages
1. Upload semua isi folder project ke repository GitHub.
2. Pastikan file utama ada di root repository.
3. Aktifkan GitHub Pages dari branch yang dipakai.
4. Setelah website online, tambahkan domain GitHub Pages ke Authorized domains Firebase.
5. Coba register, verifikasi email, lalu login.

## Catatan penting
Kalau login masih gagal, biasanya penyebabnya salah satu ini:
- Email/Password belum aktif di Firebase.
- Domain belum masuk Authorized domains.
- Realtime Database belum dibuat atau rules belum sesuai.
- Email verifikasi masuk ke folder spam.
