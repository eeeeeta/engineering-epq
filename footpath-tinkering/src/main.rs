extern crate ordered_float;

use ordered_float::OrderedFloat;
pub type OF32 = OrderedFloat<f32>;

pub struct BestFitAlgorithm {
    /// Array 'M' from the paper - steps from
    /// the route the user is taking
    pub route_headings: Vec<f32>,
    /// Array 'S' from the paper - detected
    /// step headings from accelerometer
    pub detected_headings: Vec<f32>,
    /// Matrix 'D' from the paper.
    pub matrix: Vec<Vec<f32>>,
}

impl BestFitAlgorithm {
    pub fn score(alpha: f32, beta: f32) -> f32 {
        let diff = 180.0 - ((alpha - beta).abs() - 180.0).abs();

        if diff <= 45.0 {
            0.0
        }
        else if diff <= 90.0 {
            1.0
        }
        else if diff <= 120.0 {
            2.0
        }
        else {
            10.0
        }
    }
    pub fn get_score(&self, m: usize, s: usize) -> f32 {
        if m == 0 || s == 0 {
            ::std::f32::INFINITY
        }
        else {
            let score = Self::score(self.route_headings[m-1], self.detected_headings[s-1]);
            //println!("score for ({}, {}) ({}, {}) is {}", m, s, self.route_headings[m-1], self.detected_headings[s-1], score);
            score
        }
    }
    pub fn get_d(&self, i: usize, j: usize) -> f32 {
        if i == 0 && j == 0 {
            0.0
        }
        else if i == 0 || j == 0 {
            ::std::f32::INFINITY
        }
        else {
            self.matrix[i-1][j-1]
        }
    }
    pub fn set_d(&mut self, i: usize, j: usize, val: f32) {
        self.matrix[i-1][j-1] = val;
    }
    pub fn recalc_matrix(&mut self) {
        let mut ret: Vec<Vec<f32>> = vec![];
        for _ in 0..self.route_headings.len() {
            let mut ivec = vec![];
            for _ in 0..self.detected_headings.len() {
                ivec.push(::std::f32::INFINITY.into());
            }
            ret.push(ivec);
        }
        self.matrix = ret;
        for i in 0..self.route_headings.len() {
            let i = i + 1;
            for j in 0..self.detected_headings.len() {
                let j = j + 1;
                let first = self.get_d(i - 1, j - 1) + self.get_score(i, j);
                let second = self.get_d(i - 1, j) + self.get_score(i, j - 1) + 1.5;
                let third = self.get_d(i, j - 1) + self.get_score(i - 1, j) + 1.5;
                let result = ::std::cmp::min(OrderedFloat(first), ::std::cmp::min(OrderedFloat(second), OrderedFloat(third))).into_inner();
                self.set_d(i, j, result);
            }
        }
    }
    pub fn get_pos(&mut self) -> Option<usize> {
        let (mut curmin, mut val) = (None, ::std::f32::INFINITY);
        let j = self.detected_headings.len();
        for i in 0..self.route_headings.len() {
            let i = i + 1;
            let newval = self.get_d(i, j);
            if newval < val {
                curmin = Some(i);
                val = newval;
            }
        }
        curmin
    }
}

fn main() {
    let mut alg = BestFitAlgorithm {
        route_headings: vec![90.0, 90.0, 90.0, 0.0, 0.0, 180.0, 180.0, 270.0],
        detected_headings: vec![],
        matrix: vec![]
    };
    println!("Headings {:?}", alg.route_headings);
    let inputs = vec![80.0, 100.0, 90.0, 10.0, 350.0, 0.0, 0.0, 90.0, 0.0, 170.0, 200.0, 230.0];
    for i in inputs {
        alg.detected_headings.push(i);
        alg.recalc_matrix();
        println!("Input {:.02} - step {:?}", i, alg.get_pos());
    }
}
