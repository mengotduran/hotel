/*
  Warnings:

  - Added the required column `slug` to the `Room` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "altFr" TEXT,
    "altEn" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RoomImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "RoomImage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RoomImage_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BookingRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reference" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "guestName" TEXT NOT NULL,
    "guestEmail" TEXT,
    "guestPhone" TEXT NOT NULL,
    "guestCountry" TEXT,
    "checkIn" DATETIME NOT NULL,
    "checkOut" DATETIME NOT NULL,
    "adults" INTEGER NOT NULL DEFAULT 1,
    "children" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "decidedAt" DATETIME,
    "decidedBy" TEXT,
    "declineReason" TEXT,
    "stayId" TEXT,
    "clientId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BookingRequest_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "titleFr" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "excerptFr" TEXT,
    "excerptEn" TEXT,
    "bodyFr" TEXT NOT NULL DEFAULT '',
    "bodyEn" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'NEWS',
    "coverMediaId" TEXT,
    "authorName" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Post_coverMediaId_fkey" FOREIGN KEY ("coverMediaId") REFERENCES "Media" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Room" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "name" TEXT,
    "floor" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 2,
    "baseRate" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "departmentId" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "headlineFr" TEXT,
    "headlineEn" TEXT,
    "descriptionFr" TEXT,
    "descriptionEn" TEXT,
    "amenities" TEXT NOT NULL DEFAULT '[]',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Room_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Room" ("active", "baseRate", "capacity", "departmentId", "floor", "id", "kind", "name", "notes", "number", "status") SELECT "active", "baseRate", "capacity", "departmentId", "floor", "id", "kind", "name", "notes", "number", "status" FROM "Room";
DROP TABLE "Room";
ALTER TABLE "new_Room" RENAME TO "Room";
CREATE UNIQUE INDEX "Room_number_key" ON "Room"("number");
CREATE UNIQUE INDEX "Room_slug_key" ON "Room"("slug");
CREATE INDEX "Room_status_idx" ON "Room"("status");
CREATE INDEX "Room_published_idx" ON "Room"("published");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "RoomImage_roomId_sortOrder_idx" ON "RoomImage"("roomId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "RoomImage_roomId_mediaId_key" ON "RoomImage"("roomId", "mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingRequest_reference_key" ON "BookingRequest"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "BookingRequest_stayId_key" ON "BookingRequest"("stayId");

-- CreateIndex
CREATE INDEX "BookingRequest_status_idx" ON "BookingRequest"("status");

-- CreateIndex
CREATE INDEX "BookingRequest_createdAt_idx" ON "BookingRequest"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Post_slug_key" ON "Post"("slug");

-- CreateIndex
CREATE INDEX "Post_published_publishedAt_idx" ON "Post"("published", "publishedAt");

-- CreateIndex
CREATE INDEX "Post_category_idx" ON "Post"("category");
