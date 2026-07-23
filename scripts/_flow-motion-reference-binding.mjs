export function classifyComposerReferenceIdentity({
  referenceFileName,
  attachmentAlt,
  selectedMediaSourceSha256,
  composerAttachmentSourceSha256,
  baselineAttachmentCount,
  selectedOptionCount,
  attachmentCount,
}) {
  if (attachmentAlt === referenceFileName) return "exact_alias_alt";
  if (composerAttachmentSourceSha256 && composerAttachmentSourceSha256 === selectedMediaSourceSha256) {
    return "exact_media_source";
  }
  if (baselineAttachmentCount === 0 && selectedOptionCount === 1 && attachmentCount === 1) {
    return "controlled_single_attachment_transition";
  }
  return null;
}
