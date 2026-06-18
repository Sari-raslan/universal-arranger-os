const {
  createNeutralMidiDraft
} = require("../services/neutralMidiDraft");

function createAudioArrangementMidiApiRouter(express) {
  const router = express.Router();

  router.post("/audio-arrangement/midi-draft", (req, res) => {
    try {
      const draft = createNeutralMidiDraft(req.body || {});

      res.setHeader("Content-Type", draft.contentType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${draft.filename}"`
      );
      res.setHeader(
        "X-UAOS-MIDI-Manifest",
        Buffer.from(JSON.stringify(draft.manifest), "utf8").toString("base64")
      );

      return res.status(200).send(draft.buffer);
    } catch (error) {
      return res.status(400).json({
        ok: false,
        error: {
          code: "MIDI_DRAFT_FAILED",
          message:
            error instanceof Error
              ? error.message
              : "Unable to create MIDI draft"
        }
      });
    }
  });

  return router;
}

module.exports = {
  createAudioArrangementMidiApiRouter
};