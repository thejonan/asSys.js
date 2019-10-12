import pkg from './package.json'

export default {
	input: pkg.module,
	output: {
		file: pkg.main,
		format: 'umd',
		interop: false,
		name: "asSys",
		globals: { "lodash" : "_" }
	},
	external: [ "lodash" ]
}