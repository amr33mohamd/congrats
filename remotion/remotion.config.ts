import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setConcurrency(4);
// H.264 + faststart so the clips are ready for Instagram / TikTok / WhatsApp.
Config.setCodec("h264");
