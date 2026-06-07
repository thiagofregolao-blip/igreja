-- Configuração da WebRádio (linha única / singleton)
CREATE TABLE IF NOT EXISTS "RadioConfig" (
    "id" TEXT NOT NULL,
    "streamUrl" TEXT,
    "nowPlayingUrl" TEXT,
    "stationName" TEXT,
    "coverImageUrl" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RadioConfig_pkey" PRIMARY KEY ("id")
);
