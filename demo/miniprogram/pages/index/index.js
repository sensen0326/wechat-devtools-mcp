Page({
  data: {
    title: "wechat-devtools-mcp demo",
    value: "",
    taps: 0
  },

  handleInput(event) {
    this.setData({
      value: event.detail.value
    });
  },

  handleTap() {
    this.setData({
      taps: this.data.taps + 1
    });
  },

  getStatus() {
    return {
      taps: this.data.taps,
      value: this.data.value
    };
  }
})
