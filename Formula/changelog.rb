# Homebrew formula for changelog - Show release notes for any installed CLI tool
# To use: brew install seanmozeik/tap/changelog

class Changelog < Formula
  desc "Show release notes for any installed CLI tool"
  homepage "https://github.com/seanmozeik/changelog"
  version "0.1.0"
  license "MIT"

  depends_on "bat"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/seanmozeik/changelog/releases/download/v#{version}/changelog-darwin-arm64.tar.gz"
      sha256 "a5d64e83899219602a108c1a1533ad349c90f962db9a9cac0f472cdf773547b1"
    else
      url "https://github.com/seanmozeik/changelog/releases/download/v#{version}/changelog-darwin-x64.tar.gz"
      sha256 "cdef7656243ffdc5f186c54cac593df08472ee0d2afd8eaf157e4f6ae4bc26cb"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/seanmozeik/changelog/releases/download/v#{version}/changelog-linux-arm64.tar.gz"
      sha256 "4c6c941985fac1fb0b78287389e32e46b0bfc5524ceccc75ff7daaa4e40bd585"
    else
      url "https://github.com/seanmozeik/changelog/releases/download/v#{version}/changelog-linux-x64.tar.gz"
      sha256 "bcb3176c2f1e45fc1ff4ab375847e07454f0b2a5cc75f886c287fec1a5487004"
    end
  end

  def install
    if OS.mac?
      if Hardware::CPU.arm?
        bin.install "changelog-darwin-arm64" => "changelog"
      else
        bin.install "changelog-darwin-x64" => "changelog"
      end
    elsif OS.linux?
      if Hardware::CPU.arm?
        bin.install "changelog-linux-arm64" => "changelog"
      else
        bin.install "changelog-linux-x64" => "changelog"
      end
    end
  end

  test do
    assert_match "changelog", shell_output("#{bin}/changelog --help")
  end
end
