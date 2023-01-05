import { BinaryWriter, File, IFile } from "csbinary";
import { openSync, writeFileSync } from "fs";
import { config } from "../config";
import _path from "path";
import type Monitor from "./Monitor";

export default class OsdbGenerator {
  filePath: string;
  fileName: string;
  file: IFile;
  writer: BinaryWriter;
  monitor: Monitor;

  constructor(monitor: Monitor) {
    this.fileName = monitor.collection.name + ".osdb";
    this.filePath = _path.join(
      config.directory,
      monitor.collection.name, // Folder name
      this.fileName
    );
    // Create file
    writeFileSync(this.filePath, "");

    this.file = File(openSync(this.filePath, "w")); // "w" for write

    this.writer = new BinaryWriter(this.file);

    this.monitor = monitor;
  }

  // * Refer https://github.com/Piotrekol/CollectionManager/blob/master/CollectionManagerDll/Modules/FileIO/FileCollections/OsdbCollectionHandler.cs#L89
  async writeOsdb(): Promise<void> {
    try {
      // Version 6 does not need to compress
      this.writer.writeString("o!dm6");

      // Date
      this.writer.writeDouble(this.toOADate(new Date()));

      // Editor
      this.writer.writeString(this.monitor.collection.uploader.username);

      // Num of collections
      this.writer.writeInt32(1); // Always 1

      // Name
      this.writer.writeString(this.monitor.collection.name);

      // Beatmap count
      this.writer.writeInt32(this.monitor.collection.beatMapCount);

      this.monitor.collection.beatMapSets.forEach(
        (beatMapSet, beatMapSetId) => {
          beatMapSet.beatMaps.forEach((beatmap, beatMapId) => {
            // BeatmapId
            this.writer.writeInt32(beatMapId);

            // BeatmapSetId
            this.writer.writeInt32(beatMapSetId);

            // Artist
            this.writer.writeString(beatMapSet.artist ?? "Unknown");
            // Title
            this.writer.writeString(beatMapSet.title ?? "Unknown");
            // Version
            this.writer.writeString(beatmap.version ?? "Unknown");

            // Md5
            this.writer.writeString(beatmap.checksum);

            // User comment
            this.writer.writeString("");

            // Play mode
            this.writer.writeByte(beatmap.mode ?? 0);

            // Mod PP Star
            this.writer.writeDouble(beatmap.difficulty_rating ?? 0);
          });
        }
      );

      // Map with hash
      this.writer.writeInt32(0); // Always 0

      // Footer
      this.writer.writeString("By Piotrekol"); // Fixed Footer
    } catch (e) {
      throw e;
    } finally {
      this.closeWriter();
    }
  }

  private toOADate(date: Date): number {
    const timezoneOffset = date.getTimezoneOffset() / (60 * 24);
    const msDateObj = date.getTime() / 86400000 + (25569 - timezoneOffset);
    return msDateObj;
  }

  private closeWriter(): void {
    this.writer.close();
  }
}
