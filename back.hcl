group "default" {
  targets = ["back"]
}

target "back" {
  context    = "back/"
  dockerfile = "Dockerfile"
  tags = ["statox/api"]
  # attest = [
  #   "type=provenance,mode=max",
  #   "type=sbom"
  # ]
}
