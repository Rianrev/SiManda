!macro preInit
  SetRegView 64
  WriteRegStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "C:\SiManda"
  WriteRegStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "C:\SiManda"
!macroend
