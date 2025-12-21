describe('sanity', () => {
  it('runs without infra dependencies', () => {
    expect(process.env.NODE_ENV).toBeDefined();
  });
});
