-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th3 25, 2026 lúc 05:18 AM
-- Phiên bản máy phục vụ: 10.4.32-MariaDB
-- Phiên bản PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `chat_app`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `chat_rooms`
--

CREATE TABLE `chat_rooms` (
  `id` int(10) UNSIGNED NOT NULL,
  `room_id` varchar(100) NOT NULL,
  `label` varchar(100) NOT NULL,
  `created_by` int(10) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `chat_rooms`
--

INSERT INTO `chat_rooms` (`id`, `room_id`, `label`, `created_by`, `created_at`) VALUES
(1, 'room-1', 'room-1', NULL, '2026-03-25 09:46:05'),
(2, 'room-2', 'room-2', NULL, '2026-03-25 09:46:05'),
(3, 'room3', 'room3', 5, '2026-03-25 09:46:19');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `direct_messages`
--

CREATE TABLE `direct_messages` (
  `id` int(10) UNSIGNED NOT NULL,
  `sender_id` int(10) UNSIGNED NOT NULL,
  `receiver_id` int(10) UNSIGNED NOT NULL,
  `content` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `reply_to_message_id` int(10) UNSIGNED DEFAULT NULL,
  `is_revoked` tinyint(1) NOT NULL DEFAULT 0,
  `revoked_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `direct_messages`
--

INSERT INTO `direct_messages` (`id`, `sender_id`, `receiver_id`, `content`, `created_at`, `reply_to_message_id`, `is_revoked`, `revoked_at`) VALUES
(1, 5, 6, 'hi', '2026-03-25 09:57:08', NULL, 0, NULL),
(2, 5, 6, 'hi', '2026-03-25 09:57:16', NULL, 0, NULL),
(3, 6, 5, 'hi', '2026-03-25 10:12:30', NULL, 0, NULL),
(4, 5, 6, 'hi', '2026-03-25 10:12:39', NULL, 0, NULL),
(5, 5, 6, 'a', '2026-03-25 10:12:44', NULL, 0, NULL),
(6, 5, 6, 'Tin nhắn đã được thu hồi', '2026-03-25 10:12:45', NULL, 1, '2026-03-25 10:56:48'),
(7, 5, 6, 'hi', '2026-03-25 10:13:00', NULL, 0, NULL),
(8, 6, 5, 'hi', '2026-03-25 10:13:09', NULL, 0, NULL),
(9, 6, 5, 'hi', '2026-03-25 10:13:31', NULL, 0, NULL),
(10, 5, 6, 'hi', '2026-03-25 10:14:14', NULL, 0, NULL),
(11, 5, 6, 'test', '2026-03-25 10:14:26', NULL, 0, NULL),
(12, 6, 5, 'hi', '2026-03-25 10:20:10', NULL, 0, NULL),
(13, 6, 5, 'ổn đó', '2026-03-25 10:20:14', NULL, 0, NULL),
(14, 5, 6, 'Tin nhắn đã được thu hồi', '2026-03-25 10:42:57', NULL, 1, '2026-03-25 11:06:29'),
(15, 5, 6, 'Tin nhắn đã được thu hồi', '2026-03-25 10:51:18', NULL, 1, '2026-03-25 11:06:28'),
(16, 5, 6, 'Tin nhắn đã được thu hồi', '2026-03-25 10:51:23', NULL, 1, '2026-03-25 11:06:26'),
(17, 5, 6, 'fd', '2026-03-25 11:06:36', NULL, 0, NULL),
(18, 5, 6, 'f', '2026-03-25 11:06:37', NULL, 0, NULL),
(19, 5, 6, 'f', '2026-03-25 11:06:38', NULL, 0, NULL),
(20, 5, 6, 'f', '2026-03-25 11:06:39', NULL, 0, NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `friendships`
--

CREATE TABLE `friendships` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_one_id` int(10) UNSIGNED NOT NULL,
  `user_two_id` int(10) UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `friendships`
--

INSERT INTO `friendships` (`id`, `user_one_id`, `user_two_id`, `created_at`) VALUES
(1, 5, 6, '2026-03-25 09:56:59');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `friend_requests`
--

CREATE TABLE `friend_requests` (
  `id` int(10) UNSIGNED NOT NULL,
  `sender_id` int(10) UNSIGNED NOT NULL,
  `receiver_id` int(10) UNSIGNED NOT NULL,
  `status` enum('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `friend_requests`
--

INSERT INTO `friend_requests` (`id`, `sender_id`, `receiver_id`, `status`, `created_at`) VALUES
(1, 6, 5, 'accepted', '2026-03-25 09:56:48');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `messages`
--

CREATE TABLE `messages` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `room` varchar(100) NOT NULL,
  `content` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `reply_to_message_id` int(10) UNSIGNED DEFAULT NULL,
  `is_revoked` tinyint(1) NOT NULL DEFAULT 0,
  `revoked_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `messages`
--

INSERT INTO `messages` (`id`, `user_id`, `room`, `content`, `created_at`, `reply_to_message_id`, `is_revoked`, `revoked_at`) VALUES
(1, 1, 'global', 'Chào mừng đến với phòng chat global!', '2026-03-02 21:31:53', NULL, 0, NULL),
(2, 2, 'global', 'Xin chào mọi người, mình là Tú.', '2026-03-02 21:32:53', NULL, 0, NULL),
(3, 3, 'global', 'Hạ vừa tham gia cuộc trò chuyện.', '2026-03-02 21:33:53', NULL, 0, NULL),
(4, 1, 'room-1', 'Tin nhắn thử nghiệm ở room-1 từ Anh.', '2026-03-02 21:34:53', NULL, 0, NULL),
(5, 2, 'room-2', 'Tú đang test room-2.', '2026-03-02 21:35:53', NULL, 0, NULL),
(6, 4, 'global', 'hi', '2026-03-02 22:19:43', NULL, 0, NULL),
(7, 5, 'global', 'hi', '2026-03-25 09:09:48', NULL, 0, NULL),
(9, 5, 'room-2', 'hi', '2026-03-25 09:21:01', NULL, 0, NULL),
(10, 5, 'room-2', 'hi', '2026-03-25 09:30:14', NULL, 0, NULL),
(13, 5, 'room-2', 'hi', '2026-03-25 10:23:51', NULL, 0, NULL),
(14, 5, 'room-2', 'Tin nhắn đã được thu hồi', '2026-03-25 10:24:08', NULL, 1, '2026-03-25 10:43:26'),
(15, 5, 'global', '.', '2026-03-25 11:08:31', NULL, 0, NULL),
(16, 5, 'global', '.', '2026-03-25 11:08:32', NULL, 0, NULL),
(17, 5, 'global', '.', '2026-03-25 11:08:32', NULL, 0, NULL),
(18, 5, 'global', '.', '2026-03-25 11:08:32', NULL, 0, NULL),
(19, 5, 'global', '.', '2026-03-25 11:08:33', NULL, 0, NULL),
(20, 5, 'global', '.', '2026-03-25 11:08:33', NULL, 0, NULL),
(21, 5, 'global', '.', '2026-03-25 11:08:34', NULL, 0, NULL),
(22, 5, 'global', '.', '2026-03-25 11:08:34', NULL, 0, NULL),
(23, 5, 'global', '.', '2026-03-25 11:08:35', NULL, 0, NULL),
(24, 5, 'room-1', '.', '2026-03-25 11:08:57', NULL, 0, NULL),
(25, 5, 'room-1', '.', '2026-03-25 11:08:58', NULL, 0, NULL),
(26, 5, 'room-1', '.', '2026-03-25 11:08:58', NULL, 0, NULL),
(27, 5, 'room-1', '.', '2026-03-25 11:08:58', NULL, 0, NULL),
(28, 5, 'room-1', '.', '2026-03-25 11:08:58', NULL, 0, NULL),
(29, 5, 'room-1', '.', '2026-03-25 11:08:59', NULL, 0, NULL),
(30, 5, 'room-1', '.', '2026-03-25 11:08:59', NULL, 0, NULL),
(31, 5, 'room-1', '.', '2026-03-25 11:08:59', NULL, 0, NULL),
(32, 5, 'room-1', '.', '2026-03-25 11:09:00', NULL, 0, NULL),
(33, 5, 'room-1', '.', '2026-03-25 11:09:00', NULL, 0, NULL),
(34, 5, 'room-1', '.', '2026-03-25 11:09:02', NULL, 0, NULL),
(35, 5, 'room-1', '.', '2026-03-25 11:09:03', NULL, 0, NULL),
(36, 5, 'room-1', '.', '2026-03-25 11:09:04', NULL, 0, NULL),
(37, 5, 'room3', '.', '2026-03-25 11:10:42', NULL, 0, NULL),
(38, 5, 'room3', '.', '2026-03-25 11:10:43', NULL, 0, NULL),
(39, 5, 'room3', '.', '2026-03-25 11:10:43', NULL, 0, NULL),
(40, 5, 'room3', '.', '2026-03-25 11:10:43', NULL, 0, NULL),
(41, 5, 'room3', '.', '2026-03-25 11:10:44', NULL, 0, NULL),
(42, 5, 'room3', '.', '2026-03-25 11:10:44', NULL, 0, NULL),
(43, 5, 'room3', '.', '2026-03-25 11:10:44', NULL, 0, NULL),
(44, 5, 'room3', '.', '2026-03-25 11:10:45', NULL, 0, NULL),
(45, 5, 'room3', '.', '2026-03-25 11:10:45', NULL, 0, NULL),
(46, 5, 'room3', '.', '2026-03-25 11:10:46', NULL, 0, NULL),
(47, 5, 'room3', '.', '2026-03-25 11:10:48', NULL, 0, NULL),
(48, 5, 'room3', '.', '2026-03-25 11:10:49', NULL, 0, NULL),
(49, 5, 'room3', '.', '2026-03-25 11:10:49', NULL, 0, NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `last_online` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`id`, `username`, `password_hash`, `last_online`, `created_at`) VALUES
(1, 'nguyenvana', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAg/P..iGUtkLjxJvLCYOtJk9gS5e', '2026-03-02 21:36:53', '2026-03-02 21:36:53'),
(2, 'tranthib', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAg/P..iGUtkLjxJvLCYOtJk9gS5e', '2026-03-02 21:36:53', '2026-03-02 21:36:53'),
(3, 'lequangc', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAg/P..iGUtkLjxJvLCYOtJk9gS5e', '2026-03-02 21:36:53', '2026-03-02 21:36:53'),
(4, 'nguyenvanb', '$2a$10$TZGSWXEjjGQO1Uu.RdNFieAaAEp60a0vNjfXU295zbT6xjDcKYKY6', '2026-03-02 22:19:49', '2026-03-02 22:18:26'),
(5, 'admin', '$2a$10$G4n6BV5YDwoxdINhnlf5TOab5/mhR6uEUT2FTfC/4kEVy8E44BRn6', '2026-03-25 11:17:40', '2026-03-25 09:09:27'),
(6, 'admin1', '$2a$10$QRlEYUzZh/xpKPmlrH97COXM/zzkvwcN5S.tI54Nl71br2wmZjBc6', '2026-03-25 11:17:19', '2026-03-25 09:56:41');

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `chat_rooms`
--
ALTER TABLE `chat_rooms`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `room_id` (`room_id`),
  ADD KEY `fk_chat_rooms_user` (`created_by`);

--
-- Chỉ mục cho bảng `direct_messages`
--
ALTER TABLE `direct_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_direct_messages_sender` (`sender_id`),
  ADD KEY `fk_direct_messages_receiver` (`receiver_id`);

--
-- Chỉ mục cho bảng `friendships`
--
ALTER TABLE `friendships`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_friend_pair` (`user_one_id`,`user_two_id`),
  ADD KEY `fk_friendships_user_two` (`user_two_id`);

--
-- Chỉ mục cho bảng `friend_requests`
--
ALTER TABLE `friend_requests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_friend_request_pending` (`sender_id`,`receiver_id`,`status`),
  ADD KEY `fk_friend_requests_receiver` (`receiver_id`);

--
-- Chỉ mục cho bảng `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_messages_user` (`user_id`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `chat_rooms`
--
ALTER TABLE `chat_rooms`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT cho bảng `direct_messages`
--
ALTER TABLE `direct_messages`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT cho bảng `friendships`
--
ALTER TABLE `friendships`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `friend_requests`
--
ALTER TABLE `friend_requests`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `chat_rooms`
--
ALTER TABLE `chat_rooms`
  ADD CONSTRAINT `fk_chat_rooms_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Các ràng buộc cho bảng `direct_messages`
--
ALTER TABLE `direct_messages`
  ADD CONSTRAINT `fk_direct_messages_receiver` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_direct_messages_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `friendships`
--
ALTER TABLE `friendships`
  ADD CONSTRAINT `fk_friendships_user_one` FOREIGN KEY (`user_one_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_friendships_user_two` FOREIGN KEY (`user_two_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `friend_requests`
--
ALTER TABLE `friend_requests`
  ADD CONSTRAINT `fk_friend_requests_receiver` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_friend_requests_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `fk_messages_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
