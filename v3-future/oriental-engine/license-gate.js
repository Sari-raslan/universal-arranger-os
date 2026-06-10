export function checkLibraryLicense(lib = {}) {
  return {
    allowedForLocalUse: true,
    allowRedistribution: false,
    warning: 'UAOS stores paths and metadata only. Do not copy or redistribute samples, NKI, NCW, WAV, or protected library content.',
    library: lib
  };
}
