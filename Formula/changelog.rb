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
      sha256 "0000000000000000000000000000000000000000000000000000000000000000"
    else
      url "https://github.com/seanmozeik/changelog/releases/download/v#{version}/changelog-darwin-x64.tar.gz"
      sha256 "0000000000000000000000000000000000000000000000000000000000000000"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/seanmozeik/changelog/releases/download/v#{version}/changelog-linux-arm64.tar.gz"
      sha256 "0000000000000000000000000000000000000000000000000000000000000000"
    else
      url "https://github.com/seanmozeik/changelog/releases/download/v#{version}/changelog-linux-x64.tar.gz"
      sha256 "0000000000000000000000000000000000000000000000000000000000000000"
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
